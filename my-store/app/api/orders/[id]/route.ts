
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/admin-auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const ALLOWED_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

export async function GET(
  request: Request,
  { params }: RouteContext
) {
  try {
    if (!verifyAdminRequest(request)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        customer: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("GET /api/orders/[id] error:", error);

    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: RouteContext
) {
  try {
    if (!verifyAdminRequest(request)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const { status, notes } = body;

    if (
      status !== undefined &&
      (typeof status !== "string" ||
        !ALLOWED_STATUSES.includes(status))
    ) {
      return NextResponse.json(
        { error: "Invalid order status" },
        { status: 400 }
      );
    }

    if (
      notes !== undefined &&
      notes !== null &&
      typeof notes !== "string"
    ) {
      return NextResponse.json(
        { error: "Invalid notes" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.order.findUnique({
        where: { id },
        include: { customer: true },
      });

      if (!existing) {
        throw new Error("ORDER_NOT_FOUND");
      }

      const newStatus = status ?? existing.status;

      const shouldReward =
        newStatus === "DELIVERED" &&
        existing.status !== "DELIVERED" &&
        existing.customerId !== null;

      let coinsEarned = existing.coinsEarned;

      if (shouldReward) {
        const customerId = existing.customerId!;

        coinsEarned =
          Math.round(existing.total * 0.03 * 100) / 100;

        const previousDeliveredOrders = await tx.order.count({
          where: {
            customerId,
            status: "DELIVERED",
            id: { not: id },
          },
        });

        await tx.customer.update({
          where: { id: customerId },
          data: {
            coins: { increment: coinsEarned },
          },
        });

        if (
          previousDeliveredOrders === 0 &&
          existing.customer?.referredBy
        ) {
          const referralLog = await tx.referralLog.findFirst({
            where: {
              referredEmail: existing.customer.email,
              status: "PENDING",
            },
          });

          if (referralLog) {
            const referrer = await tx.customer.findUnique({
              where: {
                referralCode: existing.customer.referredBy,
              },
            });

            if (referrer) {
              await tx.customer.update({
                where: { id: referrer.id },
                data: {
                  coins: { increment: 50 },
                  totalReferrals: { increment: 1 },
                },
              });

              await tx.referralLog.updateMany({
                where: {
                  referredEmail: existing.customer.email,
                  status: "PENDING",
                },
                data: {
                  status: "COMPLETED",
                  coinsAwarded: 50,
                },
              });
            }
          }
        }
      }

      const order = await tx.order.update({
        where: { id },
        data: {
          status: newStatus,
          ...(notes !== undefined
            ? { notes: notes === null ? null : notes.trim() }
            : {}),
          ...(shouldReward ? { coinsEarned } : {}),
        },
        include: {
          items: true,
        },
      });

      return order;
    });

    return NextResponse.json({ order: result });
  } catch (error) {
    console.error("PUT /api/orders/[id] error:", error);

    if (
      error instanceof Error &&
      error.message === "ORDER_NOT_FOUND"
    ) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: RouteContext
) {
  try {
    if (!verifyAdminRequest(request)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const existing = await prisma.order.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    await prisma.order.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/orders/[id] error:", error);

    return NextResponse.json(
      { error: "Failed to delete order" },
      { status: 500 }
    );
  }
}
