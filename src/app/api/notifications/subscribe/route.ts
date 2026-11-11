import React from "react";
import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { SubjectChannel, SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth/auth";
import { env } from "@/lib/env";
import { getClientIp } from "@/lib/security/sanitize";
import { checkRateLimit } from "@/lib/security/rateLimit";
import { getResendClient } from "@/lib/resend";
import { DoubleOptInEmail } from "@/emails/DoubleOptInEmail";

export const subscribeRequestSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Invalid email format.")
    .max(255, "Email address is too long."),
  subjects: z
    .array(z.nativeEnum(SubjectChannel))
    .min(1, "At least one subject channel must be selected."),
});

export type SubscribeRequest = z.infer<typeof subscribeRequestSchema>;

export async function POST(request: Request) {
  // 1. Database configuration check
  if (!env.DATABASE_URL) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  // 2. Rate limiting check (5 req/min per IP)
  const ip = getClientIp(request);
  const rateLimitHit = await checkRateLimit(`ip:${ip}:subscribe`, "notification-subscribe");
  if (rateLimitHit) return rateLimitHit;

  // 3. Content-Type check
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json({ error: "Content-Type must be application/json." }, { status: 415 });
  }

  // 4. Parse request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  // 5. Zod schema validation
  const parseResult = subscribeRequestSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      {
        error: parseResult.error.issues[0]?.message ?? "Validation failed.",
        details: parseResult.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const { email, subjects } = parseResult.data;
  const normalizedEmail = email.toLowerCase().trim();
  const uniqueSubjects = Array.from(new Set(subjects));

  // 6. Inspect authentication status
  const session = await auth();
  const authenticatedUserId = session?.user?.id ?? null;
  const sessionEmail = session?.user?.email?.toLowerCase().trim() ?? null;

  // SECURITY (SEC-01): Only auto-verify and link account if caller owns this session email
  const isOwnEmail = !!authenticatedUserId && !!sessionEmail && sessionEmail === normalizedEmail;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Find existing subscriber by email
      const existing = await tx.subscriber.findUnique({
        where: { email: normalizedEmail },
      });

      // Defensive check: prevent linking another user's existing account
      if (
        authenticatedUserId &&
        existing?.userId &&
        existing.userId !== authenticatedUserId
      ) {
        throw new Error("ACCOUNT_COLLISION");
      }

      // Only auto-verify if caller owns this session email; otherwise require double opt-in
      const shouldBeVerified = isOwnEmail || (existing?.isVerified ?? false);
      let verificationToken: string | null = null;
      let tokenExpiresAt: Date | null = null;

      if (!shouldBeVerified) {
        verificationToken = randomBytes(32).toString("hex");
        tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      }

      // Upsert subscriber record
      const subscriber = await tx.subscriber.upsert({
        where: { email: normalizedEmail },
        update: {
          ...(isOwnEmail && { userId: authenticatedUserId }),
          status: SubscriptionStatus.ACTIVE,
          ...(shouldBeVerified
            ? {
                isVerified: true,
                verificationToken: null,
                tokenExpiresAt: null,
              }
            : {
                verificationToken,
                tokenExpiresAt,
              }),
        },
        create: {
          email: normalizedEmail,
          userId: isOwnEmail ? authenticatedUserId : null,
          isVerified: shouldBeVerified,
          verificationToken,
          tokenExpiresAt,
          unsubscribeToken: randomBytes(32).toString("hex"),
          status: SubscriptionStatus.ACTIVE,
        },
      });

      // Topic subscriptions & ALL cleanup
      if (uniqueSubjects.includes(SubjectChannel.ALL)) {
        await tx.subscription.deleteMany({
          where: {
            subscriberId: subscriber.id,
            subject: { not: SubjectChannel.ALL },
          },
        });
        await tx.subscription.upsert({
          where: {
            subscriberId_subject: {
              subscriberId: subscriber.id,
              subject: SubjectChannel.ALL,
            },
          },
          update: {},
          create: {
            subscriberId: subscriber.id,
            subject: SubjectChannel.ALL,
          },
        });
      } else {
        for (const subject of uniqueSubjects) {
          await tx.subscription.upsert({
            where: {
              subscriberId_subject: {
                subscriberId: subscriber.id,
                subject,
              },
            },
            update: {},
            create: {
              subscriberId: subscriber.id,
              subject,
            },
          });
        }
      }

      return {
        requiresVerification: !shouldBeVerified,
        verificationToken,
      };
    });

    // SECURITY & RELIABILITY (SEC-02): Dispatch Double Opt-In verification email
    if (result.requiresVerification && result.verificationToken) {
      try {
        const apiKey = env.RESEND_API_KEY || process.env.RESEND_API_KEY;
        if (apiKey) {
          const resend = getResendClient(apiKey);
          const { renderToStaticMarkup } = await import("react-dom/server");
          const html = renderToStaticMarkup(
            React.createElement(DoubleOptInEmail, {
              verificationToken: result.verificationToken,
              subjects: uniqueSubjects,
              recipientEmail: normalizedEmail,
            })
          );

          const fromEmail =
            env.RESEND_FROM_EMAIL ||
            process.env.RESEND_FROM_EMAIL ||
            "System Simulator <releases@systemsimulator.dev>";

          await resend.emails.send({
            from: fromEmail,
            to: normalizedEmail,
            subject: "Confirm your System Simulator subscription",
            html: `<!DOCTYPE html>${html}`,
          });
        } else {
          console.warn("[SubscribeRoute] RESEND_API_KEY is not configured; skipping double opt-in email dispatch.");
        }
      } catch (emailErr) {
        console.error("[SubscribeRoute] Failed to dispatch double opt-in email:", emailErr);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: result.requiresVerification
          ? "Please check your inbox to verify your subscription."
          : "Subscribed successfully.",
        requiresVerification: result.requiresVerification,
      },
      { status: 200 }
    );
  } catch (err) {
    if (err instanceof Error && err.message === "ACCOUNT_COLLISION") {
      return NextResponse.json(
        { error: "Email is already associated with another account." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to process subscription." },
      { status: 500 }
    );
  }
}
