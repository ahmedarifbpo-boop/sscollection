
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ALLOWED_EVENTS = [
  "page_view",
  "product_view",
  "add_to_cart",
  "remove_from_cart",
  "checkout_start",
  "purchase",
  "page_exit",
];

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      page,
      eventType,
      productId,
      referrer,
      utmSource,
      visitorId,
      sessionId,
      durationSeconds,
      eventData,
    } = body;

    // Required visitor information
    if (
      !visitorId ||
      typeof visitorId !== "string" ||
      visitorId.length > 100
    ) {
      return NextResponse.json(
        { error: "Valid visitorId is required" },
        { status: 400 }
      );
    }

    if (
      !sessionId ||
      typeof sessionId !== "string" ||
      sessionId.length > 100
    ) {
      return NextResponse.json(
        { error: "Valid sessionId is required" },
        { status: 400 }
      );
    }

    // Validate event
    const type = ALLOWED_EVENTS.includes(eventType)
      ? eventType
      : "page_view";

    // IP address
    const forwarded = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");

    const ip = forwarded
      ? forwarded.split(",")[0].trim()
      : realIp || "Unknown IP";

    // Browser and device detection
    const userAgent = request.headers.get("user-agent") || "";
    const { browser, deviceType } = parseUserAgent(userAgent);

    // Vercel location headers (no external API call)
    const cityHeader = request.headers.get("x-vercel-ip-city");
    const countryHeader = request.headers.get("x-vercel-ip-country");

    const city = safeDecode(cityHeader);
    const country = countryHeader || null;

    // Traffic source
    const trafficSource = detectSource(utmSource, referrer);

    // Page duration validation
    const duration =
      Number.isFinite(Number(durationSeconds))
        ? Math.min(Math.max(Math.floor(Number(durationSeconds)), 0), 86400)
        : null;

    // Save only valid event data
    const safeEventData =
      eventData && typeof eventData === "object" && !Array.isArray(eventData)
        ? eventData
        : undefined;

    // Save visitor event
    const log = await prisma.visitorLog.create({
      data: {
        ip,
        visitorId,
        sessionId,
        page: typeof page === "string" ? page.slice(0, 1000) : "/",
        browser,
        deviceType,
        eventType: type,
        productId:
          typeof productId === "string" && productId.length <= 100
            ? productId
            : null,
        trafficSource,
        referrer:
          typeof referrer === "string" ? referrer.slice(0, 1000) : null,
        city,
        country,
        durationSeconds: duration,
        eventData: safeEventData,
      },
    });

    return NextResponse.json({
      success: true,
      eventId: log.id,
    });
  } catch (error) {
    console.error("Track API error:", error);

    return NextResponse.json(
      { error: "Failed to track visitor" },
      { status: 500 }
    );
  }
}

/* ===== BROWSER AND DEVICE DETECTION ===== */

function parseUserAgent(ua: string) {
  let browser = "Other";

  if (/Edg\//i.test(ua)) {
    browser = "Edge";
  } else if (/OPR\//i.test(ua) || /Opera/i.test(ua)) {
    browser = "Opera";
  } else if (/SamsungBrowser/i.test(ua)) {
    browser = "Samsung Internet";
  } else if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) {
    browser = "Chrome";
  } else if (/Firefox\//i.test(ua)) {
    browser = "Firefox";
  } else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) {
    browser = "Safari";
  }

  let deviceType = "Desktop";

  if (/iPad|Tablet/i.test(ua)) {
    deviceType = "Tablet";
  } else if (/iPhone/i.test(ua)) {
    deviceType = "iPhone";
  } else if (/Android/i.test(ua)) {
    deviceType = "Android";
  } else if (/Mobile/i.test(ua)) {
    deviceType = "Mobile";
  }

  return { browser, deviceType };
}

/* ===== SAFE LOCATION DECODING ===== */

function safeDecode(value: string | null) {
  if (!value) return null;

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/* ===== TRAFFIC SOURCE DETECTION ===== */

function detectSource(
  utmSource?: string,
  referrer?: string
) {
  if (typeof utmSource === "string" && utmSource.trim()) {
    return utmSource.trim().toLowerCase().slice(0, 100);
  }

  if (!referrer || typeof referrer !== "string") {
    return "direct";
  }

  const r = referrer.toLowerCase();

  if (r.includes("instagram")) return "instagram";
  if (r.includes("facebook") || r.includes("fb.com")) return "facebook";
  if (r.includes("tiktok")) return "tiktok";
  if (r.includes("google")) return "google";
  if (r.includes("youtube")) return "youtube";
  if (r.includes("bing")) return "bing";
  if (r.includes("pinterest")) return "pinterest";

  return "referral";
}
