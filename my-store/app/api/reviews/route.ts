
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function getHistoryToken(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("ss-order-history="));

  if (!cookie) return null;

  try {
    const token = decodeURIComponent(
      cookie.slice("ss-order-history=".length)
    );

    return /^[a-f0-9]{64}$/i.test(token) ? token : null;
  } catch {
    return null;
  }
}

// GET: Approved product reviews
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    const reviews = await prisma.review.findMany({
      where: {
        productId,
        status: "APPROVED",
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        customerName: true,
        rating: true,
        comment: true,
        verifiedPurchase: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error("GET reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

// POST: Customer submits review from Order History
export async function POST(request: Request) {
  try {
    const token = getHistoryToken(request);

    if (!token) {
      return NextResponse.json(
        { error: "Please open your order history first" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const orderId = String(body.orderId || "");
    const productId = String(body.productId || "");
    const rating = Number(body.rating);
    const comment =
      typeof body.comment === "string" ? body.comment.trim() : "";

    if (
      !orderId ||
      !productId ||
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      return NextResponse.json(
        { error: "Invalid review details" },
        { status: 400 }
      );
    }

    if (!comment || comment.length > 1500) {
      return NextResponse.json(
        { error: "Review must be between 1 and 1500 characters" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        historyToken: token,
      },
      include: {
        items: {
          where: { productId },
          select: { productId: true },
        },
      },
    });

    if (!order || order.items.length === 0) {
      return NextResponse.json(
        { error: "This product was not found in your order" },
        { status: 403 }
      );
    }

    const review = await prisma.review.create({
      data: {
        orderId,
        productId,
        customerId: order.customerId,
        customerName: order.customerName,
        rating,
        comment,
        status: "PENDING",
        verifiedPurchase: true,
      },
      select: {
        id: true,
        productId: true,
        rating: true,
        comment: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Your review has been submitted and is awaiting approval.",
        review,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "You have already reviewed this product for this order" },
        { status: 409 }
      );
    }

    console.error("POST reviews:", error);
    return NextResponse.json(
      { error: "Failed to submit review" },
      { status: 500 }
    );
  }
}
