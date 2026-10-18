import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/offers
export async function GET() {
  try {
    const offers = await prisma.offer.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
    });
    return NextResponse.json({ offers });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch offers" }, { status: 500 });
  }
}

// POST /api/offers
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, subtitle, image, ctaText, ctaLink } = body;

    if (!title || !image) {
      return NextResponse.json({ error: "Title and image are required" }, { status: 400 });
    }

    const offer = await prisma.offer.create({
      data: {
        title: String(title).trim(),
        subtitle: subtitle ? String(subtitle).trim() : null,
        image: String(image).trim(),
        ctaText: ctaText ? String(ctaText).trim() : "Shop Now",
        ctaLink: ctaLink ? String(ctaLink).trim() : "/",
      },
    });

    return NextResponse.json({ offer }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create offer" }, { status: 500 });
  }
}