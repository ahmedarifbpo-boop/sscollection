
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/admin-auth";

// GET /api/offers - Public
export async function GET() {
  try {
    const offers = await prisma.offer.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ offers });
  } catch (error) {
    console.error("GET /api/offers error:", error);

    return NextResponse.json(
      { error: "Failed to fetch offers" },
      { status: 500 }
    );
  }
}

// POST /api/offers - Admin only
export async function POST(request: Request) {
  try {
    const adminId = verifyAdminRequest(request);

    if (!adminId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const {
      title,
      subtitle,
      image,
      video,
      ctaText,
      ctaLink,
    } = body;

    const cleanTitle = String(title || "").trim();
    const cleanImage = String(image || "").trim();
    const cleanVideo = String(video || "").trim();

    if (!cleanTitle) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // Exactly one media type is required
    if (
      (!cleanImage && !cleanVideo) ||
      (cleanImage && cleanVideo)
    ) {
      return NextResponse.json(
        { error: "Please provide either an image or a video, not both" },
        { status: 400 }
      );
    }

    const offer = await prisma.offer.create({
      data: {
        title: cleanTitle,
        subtitle: subtitle ? String(subtitle).trim() : null,
        image: cleanImage || null,
        video: cleanVideo || null,
        ctaText: ctaText ? String(ctaText).trim() : "Shop Now",
        ctaLink: ctaLink ? String(ctaLink).trim() : "/",
      },
    });

    return NextResponse.json({ offer }, { status: 201 });
  } catch (error) {
    console.error("POST /api/offers error:", error);

    return NextResponse.json(
      { error: "Failed to create offer" },
      { status: 500 }
    );
  }
}
