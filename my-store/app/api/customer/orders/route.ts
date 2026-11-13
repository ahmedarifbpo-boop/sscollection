
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const HISTORY_COOKIE = "ss-order-history";

export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";

    const cookie = cookieHeader
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${HISTORY_COOKIE}=`));

    if (!cookie) {
      return NextResponse.json({ orders: [] });
    }

    let token: string;

    try {
      token = decodeURIComponent(
        cookie.slice(HISTORY_COOKIE.length + 1)
      );
    } catch {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      );
    }

    if (!/^[a-f0-9]{64}$/i.test(token)) {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      );
    }

    const orders = await prisma.order.findMany({
      where: {
        historyToken: token,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        customerPhone: true,
        customerEmail: true,
        customerAddress: true,
        subtotal: true,
        shipping: true,
        total: true,
        status: true,
        createdAt: true,

        items: {
          select: {
            id: true,
            productId: true,
            name: true,
            price: true,
            quantity: true,
            image: true,
          },
        },

        reviews: {
          select: {
            id: true,
            productId: true,
            rating: true,
            comment: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("GET /api/customer/orders:", error);

    return NextResponse.json(
      { error: "Failed to load orders" },
      { status: 500 }
    );
  }
}
