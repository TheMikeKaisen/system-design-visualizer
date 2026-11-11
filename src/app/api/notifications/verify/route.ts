import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { SubscriptionStatus } from "@prisma/client";
import { getClientIp } from "@/lib/security/sanitize";
import { checkRateLimit } from "@/lib/security/rateLimit";

export async function GET(request: Request) {
  // 1. Database check
  if (!env.DATABASE_URL) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  // 2. Rate limiting check (10 req/min per IP)
  const ip = getClientIp(request);
  const rateLimitHit = await checkRateLimit(`ip:${ip}:verify`, "notification-verify");
  if (rateLimitHit) return rateLimitHit;

  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token")?.trim();

  // 3. Missing token check
  if (!token) {
    return NextResponse.json(
      { error: "Verification token is required." },
      { status: 400 }
    );
  }

  try {
    // 4. Token lookup
    const subscriber = await prisma.subscriber.findUnique({
      where: { verificationToken: token },
    });

    if (!subscriber) {
      return NextResponse.json(
        { error: "Invalid verification token." },
        { status: 400 }
      );
    }

    // 5. Strict 24-hour expiration check
    const now = new Date();
    if (!subscriber.tokenExpiresAt || subscriber.tokenExpiresAt < now) {
      return NextResponse.json(
        { error: "Verification token has expired. Please subscribe again." },
        { status: 410 }
      );
    }

    // 6. Atomic verification update
    await prisma.subscriber.update({
      where: { id: subscriber.id },
      data: {
        isVerified: true,
        verificationToken: null,
        tokenExpiresAt: null,
        status: SubscriptionStatus.ACTIVE,
      },
    });

    // 7. Dual-mode response (Browser Redirect vs API JSON)
    const acceptHeader = request.headers.get("accept") ?? "";
    const isBrowserNavigation =
      acceptHeader.includes("text/html") && !acceptHeader.includes("application/json");

    if (isBrowserNavigation) {
      const origin = new URL(request.url).origin || env.NEXT_PUBLIC_APP_URL || "";
      return NextResponse.redirect(new URL("/verify?status=success", origin));
    }

    return NextResponse.json(
      {
        success: true,
        message: "Email verified successfully.",
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to verify email." },
      { status: 500 }
    );
  }
}
