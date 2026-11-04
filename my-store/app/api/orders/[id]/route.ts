import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/orders/[id] — ek order ki poori details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        customer: true, 
      },
    });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json({ order });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}

// PUT /api/orders/[id] — order ka status update karo aur Coins do
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, notes } = body;

    const existing = await prisma.order.findUnique({ 
      where: { id },
      include: { customer: true } 
    });

    if (!existing) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Order update karo
    const order = await prisma.order.update({
      where: { id },
      data: {
        status: status ? String(status) : undefined,
        notes: notes !== undefined ? String(notes) : undefined,
      },
      include: { items: true },
    });

    // 🟢 COINS LOGIC: Agar status DELIVERED ho gaya hai
    if (status === "DELIVERED" && existing.status !== "DELIVERED" && existing.customerId) {
      
      const customerId = existing.customerId;
      const orderTotal = existing.total;

      // 1. Customer ko 3% Coins do
      const coinsEarned = orderTotal * 0.03;
      
      await prisma.customer.update({
        where: { id: customerId },
        data: { coins: { increment: coinsEarned } },
      });

      // 2. Referral Logic (Agar customer kisi ke referral se aaya hai)
      if (existing.customer?.referredBy) {
        // Check karo ke kya ye us customer ka PEHLA delivered order hai?
        const previousDeliveredOrders = await prisma.order.count({
          where: {
            customerId: customerId,
            status: "DELIVERED",
            id: { not: id }, // Current order ko count mein na lo
          },
        });

        // Agar ye pehla delivered order hai, to referrer ko Rs. 50 do
        if (previousDeliveredOrders === 0) {
          const referrer = await prisma.customer.findUnique({
            where: { referralCode: existing.customer.referredBy },
          });

          if (referrer) {
            // Referrer ke coins aur totalReferrals barhao
            await prisma.customer.update({
              where: { id: referrer.id },
              data: {
                coins: { increment: 50 },
                totalReferrals: { increment: 1 }, // 👈 Ye line count barhati hai
              },
            });

            // ReferralLog ka status COMPLETED kar do
            await prisma.referralLog.updateMany({
              where: { referredEmail: existing.customer.email, status: "PENDING" },
              data: { status: "COMPLETED", coinsAwarded: 50 },
            });
          }
        }
      }

      // Order table mein bhi coinsEarned update kar do
      await prisma.order.update({
        where: { id },
        data: { coinsEarned: coinsEarned },
      });
    }

    return NextResponse.json({ order });
  } catch (error) {
      console.error("PUT /api/orders/[id] error:", error);
      return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}

// DELETE /api/orders/[id] — order delete karo
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    await prisma.order.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete order" }, { status: 500 });
  }
}