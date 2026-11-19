
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

const CUSTOMER_FIELDS = [
  "customerName",
  "customerPhone",
  "customerAlternativePhone",
  "customerAddress",
  "customerEmail",
] as const;

export async function GET(
  request: Request,
  { params }: RouteContext
) {
  try {
    const auth = await verifyAdminRequest(request);

    if (!auth) {
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
    const auth = await verifyAdminRequest(request);

    if (!auth) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const {
      status,
      notes,
      allowOpenParcel,
      courierCost,
    } = body;

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

    if (
      allowOpenParcel !== undefined &&
      typeof allowOpenParcel !== "boolean"
    ) {
      return NextResponse.json(
        { error: "Invalid open parcel permission" },
        { status: 400 }
      );
    }

    if (
      courierCost !== undefined &&
      (
        typeof courierCost !== "number" ||
        !Number.isFinite(courierCost) ||
        courierCost < 0
      )
    ) {
      return NextResponse.json(
        { error: "Courier cost must be a valid non-negative number" },
        { status: 400 }
      );
    }

    const hasCustomerChanges = CUSTOMER_FIELDS.some(
      (field) => Object.prototype.hasOwnProperty.call(body, field)
    );

    const customerData: {
      customerName?: string;
      customerPhone?: string;
      customerAlternativePhone?: string | null;
      customerAddress?: string;
      customerEmail?: string | null;
    } = {};

    if (hasCustomerChanges) {
      if (
        body.customerName !== undefined &&
        (typeof body.customerName !== "string" ||
          !body.customerName.trim())
      ) {
        return NextResponse.json(
          { error: "Customer name is required" },
          { status: 400 }
        );
      }

      if (
        body.customerPhone !== undefined &&
        (typeof body.customerPhone !== "string" ||
          !body.customerPhone.trim())
      ) {
        return NextResponse.json(
          { error: "Customer phone is required" },
          { status: 400 }
        );
      }

      if (
        body.customerAddress !== undefined &&
        (typeof body.customerAddress !== "string" ||
          !body.customerAddress.trim())
      ) {
        return NextResponse.json(
          { error: "Customer address is required" },
          { status: 400 }
        );
      }

      if (
        body.customerAlternativePhone !== undefined &&
        body.customerAlternativePhone !== null &&
        typeof body.customerAlternativePhone !== "string"
      ) {
        return NextResponse.json(
          { error: "Invalid alternative phone" },
          { status: 400 }
        );
      }

      if (
        body.customerEmail !== undefined &&
        body.customerEmail !== null &&
        typeof body.customerEmail !== "string"
      ) {
        return NextResponse.json(
          { error: "Invalid customer email" },
          { status: 400 }
        );
      }

      if (body.customerName !== undefined) {
        customerData.customerName = body.customerName.trim();
      }

      if (body.customerPhone !== undefined) {
        customerData.customerPhone = body.customerPhone.trim();
      }

      if (body.customerAddress !== undefined) {
        customerData.customerAddress = body.customerAddress.trim();
      }

      if (body.customerAlternativePhone !== undefined) {
        customerData.customerAlternativePhone =
          body.customerAlternativePhone?.trim() || null;
      }

      if (body.customerEmail !== undefined) {
        customerData.customerEmail =
          body.customerEmail?.trim() || null;
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.order.findUnique({
        where: { id },
        include: { customer: true },
      });

      if (!existing) {
        throw new Error("ORDER_NOT_FOUND");
      }

      // Customer details can only be edited while order is pending.
      if (
        hasCustomerChanges &&
        existing.status !== "PENDING"
      ) {
        throw new Error("CUSTOMER_EDIT_NOT_ALLOWED");
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
            ? {
                notes: notes === null ? null : notes.trim(),
              }
            : {}),

          ...(hasCustomerChanges ? customerData : {}),

          ...(allowOpenParcel !== undefined
            ? { allowOpenParcel }
            : {}),

          ...(courierCost !== undefined
            ? { courierCost }
            : {}),

          ...(shouldReward ? { coinsEarned } : {}),
        },
        include: {
          items: true,
          customer: true,
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

    if (
      error instanceof Error &&
      error.message === "CUSTOMER_EDIT_NOT_ALLOWED"
    ) {
      return NextResponse.json(
        {
          error:
            "Customer details can only be edited while the order is Pending.",
        },
        { status: 400 }
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
    const auth = await verifyAdminRequest(request);

    if (!auth) {
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
