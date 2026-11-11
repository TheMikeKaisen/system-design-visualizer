import { NextResponse } from "next/server";
import { SubjectChannel, SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { checkRateLimit } from "@/lib/security/rateLimit";
import { getClientIp } from "@/lib/security/sanitize";

const CANONICAL_DISCIPLINES: SubjectChannel[] = [
  SubjectChannel.JAVASCRIPT,
  SubjectChannel.OPERATING_SYSTEMS,
  SubjectChannel.JAVA,
  SubjectChannel.COMPUTER_NETWORKS,
  SubjectChannel.BACKEND,
  SubjectChannel.FRONTEND,
];

/**
 * GET /api/notifications/unsubscribe
 * RFC 8058 strictly prohibits state-modifying actions on GET.
 * If accessed via browser GET, redirect to the unsubscribe landing page.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const topic = url.searchParams.get("topic");

  if (token) {
    const origin = url.origin || env.NEXT_PUBLIC_APP_URL || "";
    const redirectUrl = new URL("/unsubscribe", origin);
    redirectUrl.searchParams.set("token", token);
    if (topic) redirectUrl.searchParams.set("topic", topic);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.json(
    { success: false, error: "Method not allowed. Use POST for 1-click unsubscription." },
    { status: 405, headers: { Allow: "POST, GET" } }
  );
}

/**
 * POST /api/notifications/unsubscribe
 * Handles RFC 8058 1-click unsubscription, form POSTs, and JSON API calls.
 */
export async function POST(request: Request) {
  // 1. Database check
  if (!env.DATABASE_URL) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  // 2. Rate limiting check (20 requests/minute per IP)
  const ip = getClientIp(request);
  const rateLimitResponse = await checkRateLimit(`ip:${ip}:unsubscribe`, "notification-unsubscribe");
  if (rateLimitResponse) return rateLimitResponse;

  // 3. Extract parameters from URL query string
  const url = new URL(request.url);
  let token = url.searchParams.get("token")?.trim() || null;
  let topic = url.searchParams.get("topic")?.trim() || null;

  // 4. Inspect Content-Type and parse body if present
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    try {
      const text = await request.text();
      if (text.trim().length > 0) {
        const body = JSON.parse(text);
        if (body && typeof body === "object") {
          if (typeof body.token === "string" && body.token.trim()) {
            token = body.token.trim();
          }
          if (typeof body.topic === "string" && body.topic.trim()) {
            topic = body.topic.trim();
          }
        }
      }
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON payload." },
        { status: 400 }
      );
    }
  } else if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    try {
      const formData = await request.formData();
      const formToken = formData.get("token");
      const formTopic = formData.get("topic");

      if (typeof formToken === "string" && formToken.trim()) {
        token = formToken.trim();
      }
      if (typeof formTopic === "string" && formTopic.trim()) {
        topic = formTopic.trim();
      }
    } catch {
      // Fallback to query parameters already extracted
    }
  }

  // 5. Validate Token Presence
  if (!token) {
    return NextResponse.json(
      { success: false, error: "Unsubscribe token is required." },
      { status: 400 }
    );
  }

  // 6. Validate Topic Parameter (if provided)
  let targetSubject: SubjectChannel | "ALL" | null = null;
  if (topic) {
    const normalized = topic.toUpperCase().trim();
    if (normalized === "ALL") {
      targetSubject = "ALL";
    } else if (Object.values(SubjectChannel).includes(normalized as SubjectChannel)) {
      targetSubject = normalized as SubjectChannel;
    } else {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid topic channel: '${topic}'. Must be one of: ALL, ${Object.values(SubjectChannel).join(", ")}.`,
        },
        { status: 400 }
      );
    }
  }

  try {
    // 7. Look up subscriber by unique unsubscribeToken
    const subscriber = await prisma.subscriber.findUnique({
      where: { unsubscribeToken: token },
      include: { subscriptions: true },
    });

    if (!subscriber) {
      return NextResponse.json(
        { success: false, error: "Subscriber not found or invalid token." },
        { status: 404 }
      );
    }

    // 8. Case A: Global Unsubscribe ('ALL' or topic omitted)
    if (!targetSubject || targetSubject === "ALL") {
      await prisma.$transaction([
        prisma.subscriber.update({
          where: { id: subscriber.id },
          data: { status: SubscriptionStatus.UNSUBSCRIBED },
        }),
        prisma.subscription.deleteMany({
          where: { subscriberId: subscriber.id },
        }),
      ]);

      return NextResponse.json(
        {
          success: true,
          message: "Unsubscribed successfully.",
          topic: "ALL",
          status: SubscriptionStatus.UNSUBSCRIBED,
        },
        { status: 200 }
      );
    }

    // 9. Case B: Granular Topic Unsubscribe (Specific discipline)
    const hasAll = subscriber.subscriptions.some((s) => s.subject === SubjectChannel.ALL);

    if (hasAll) {
      // Dynamic expansion of ALL into other canonical disciplines
      const remainingDisciplines = CANONICAL_DISCIPLINES.filter((d) => d !== targetSubject);

      await prisma.$transaction([
        prisma.subscription.deleteMany({
          where: { subscriberId: subscriber.id, subject: SubjectChannel.ALL },
        }),
        prisma.subscription.createMany({
          data: remainingDisciplines.map((subject) => ({
            subscriberId: subscriber.id,
            subject,
          })),
          skipDuplicates: true,
        }),
      ]);
    } else {
      // Standard deletion of specific topic row
      await prisma.subscription.deleteMany({
        where: { subscriberId: subscriber.id, subject: targetSubject },
      });
    }

    // 10. Check remaining subscriptions count
    const remainingSubscriptions = await prisma.subscription.findMany({
      where: { subscriberId: subscriber.id },
      select: { subject: true },
    });

    if (remainingSubscriptions.length === 0) {
      await prisma.subscriber.update({
        where: { id: subscriber.id },
        data: { status: SubscriptionStatus.UNSUBSCRIBED },
      });

      return NextResponse.json(
        {
          success: true,
          message: "Unsubscribed successfully.",
          topic: targetSubject,
          remainingTopics: [],
          status: SubscriptionStatus.UNSUBSCRIBED,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Unsubscribed successfully.",
        topic: targetSubject,
        remainingTopics: remainingSubscriptions.map((s) => s.subject),
        status: subscriber.status,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred while processing unsubscription." },
      { status: 500 }
    );
  }
}
