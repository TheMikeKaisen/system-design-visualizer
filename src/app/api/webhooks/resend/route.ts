import { NextResponse } from "next/server";
import { z } from "zod";
import { SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { verifySvixSignatureDetailed } from "@/lib/security/svix";

export const resendWebhookEventSchema = z
  .object({
    type: z.string(),
    created_at: z.string().optional(),
    data: z
      .object({
        email_id: z.string().optional(),
        to: z.union([z.array(z.string()), z.string()]).optional(),
        bounce: z
          .object({
            type: z.string().optional(),
            subType: z.string().optional(),
            message: z.string().optional(),
          })
          .optional(),
        from: z.string().optional(),
        subject: z.string().optional(),
      })
      .passthrough(),
  })
  .passthrough();

export type ResendWebhookEvent = z.infer<typeof resendWebhookEventSchema>;

export async function POST(request: Request) {
  // 1. Webhook signing secret check
  const webhookSecret =
    process.env.RESEND_WEBHOOK_SECRET || env.RESEND_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Webhook secret is not configured." },
      { status: 500 }
    );
  }

  // 2. Extract Svix headers
  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      {
        error:
          "Missing required Svix headers (svix-id, svix-timestamp, svix-signature).",
      },
      { status: 400 }
    );
  }

  // 3. Read raw request payload as text before parsing
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json(
      { error: "Unable to read request payload." },
      { status: 400 }
    );
  }

  // 4. Verify cryptographic Svix signature
  const verification = verifySvixSignatureDetailed({
    payload: rawBody,
    headers: {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    },
    secret: webhookSecret,
  });

  if (!verification.valid) {
    return NextResponse.json(
      { error: "Invalid webhook signature.", details: verification.error },
      { status: 400 }
    );
  }

  // 5. Parse and validate JSON structure
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { error: "Malformed JSON payload." },
      { status: 400 }
    );
  }

  const parseResult = resendWebhookEventSchema.safeParse(parsedJson);
  if (!parseResult.success) {
    return NextResponse.json(
      {
        error: "Malformed webhook payload structure.",
        details: parseResult.error.flatten(),
      },
      { status: 400 }
    );
  }

  const event = parseResult.data;

  // 6. Event routing
  switch (event.type) {
    case "email.bounced":
    case "email.complained": {
      const rawRecipients = event.data.to;
      const recipientList: string[] = Array.isArray(rawRecipients)
        ? rawRecipients
        : typeof rawRecipients === "string"
        ? [rawRecipients]
        : [];

      const normalizedEmails = recipientList
        .map((email) => email.trim().toLowerCase())
        .filter((email) => email.length > 0);

      if (normalizedEmails.length === 0) {
        return NextResponse.json(
          {
            received: true,
            message: "No recipient emails specified in event data.",
          },
          { status: 200 }
        );
      }

      if (!env.DATABASE_URL) {
        return NextResponse.json(
          { error: "Database not configured." },
          { status: 503 }
        );
      }

      try {
        const updateResult = await prisma.subscriber.updateMany({
          where: {
            email: { in: normalizedEmails },
          },
          data: {
            status: SubscriptionStatus.BOUNCED,
          },
        });

        return NextResponse.json(
          {
            success: true,
            event: event.type,
            deactivatedCount: updateResult.count,
          },
          { status: 200 }
        );
      } catch (dbError) {
        console.error(
          "[Resend Webhook] Database error updating subscriber status:",
          dbError
        );
        return NextResponse.json(
          { error: "Internal database error processing webhook." },
          { status: 500 }
        );
      }
    }

    case "email.delivered":
    case "email.sent":
    case "email.delivery_delayed":
    case "email.opened":
    case "email.clicked": {
      return NextResponse.json(
        {
          received: true,
          event: event.type,
          info: "Event acknowledged without state mutation.",
        },
        { status: 200 }
      );
    }

    default: {
      return NextResponse.json(
        {
          received: true,
          ignored: true,
          event: event.type,
        },
        { status: 200 }
      );
    }
  }
}
