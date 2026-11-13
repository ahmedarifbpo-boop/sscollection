
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    if (!verifyAdminRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reviews = await prisma.review.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        product: { select: { id: true, name: true, image: true } },
        order: { select: { orderNumber: true } },
      },
    });

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error("Admin reviews GET:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    if (!verifyAdminRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reviewId, status } = await request.json();

    if (!reviewId || !["APPROVED", "REJECTED", "PENDING"].includes(status)) {
      return NextResponse.json({ error: "Invalid review update" }, { status: 400 });
    }

    const review = await prisma.review.update({
      where: { id: reviewId },
      data: { status },
    });

    return NextResponse.json({ success: true, review });
  } catch (error) {
    console.error("Admin reviews PATCH:", error);
    return NextResponse.json({ error: "Failed to update review" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    if (!verifyAdminRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get("reviewId");

    if (!reviewId) {
      return NextResponse.json({ error: "Review ID is required" }, { status: 400 });
    }

    await prisma.review.delete({ where: { id: reviewId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin reviews DELETE:", error);
    return NextResponse.json({ error: "Failed to delete review" }, { status: 500 });
  }
}
