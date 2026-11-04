import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { coins: "desc" },
    });

    // Har customer ke coins ka hisaab lagao
    const customersWithCoinsData = await Promise.all(
      customers.map(async (customer) => {
        // 1. Total Earned Coins (Delivered orders se 3%)
        const deliveredOrders = await prisma.order.findMany({
          where: { customerId: customer.id, status: "DELIVERED" },
          select: { coinsEarned: true },
        });
        const earned = deliveredOrders.reduce((sum, o) => sum + o.coinsEarned, 0);

        // 2. Total Used Coins (Orders mein jo use hue)
        const ordersWithUsedCoins = await prisma.order.findMany({
          where: { customerId: customer.id, coinsUsed: { gt: 0 } },
          select: { coinsUsed: true },
        });
        const used = ordersWithUsedCoins.reduce((sum, o) => sum + o.coinsUsed, 0);

        // 3. Referral Coins
        const referralLogs = await prisma.referralLog.findMany({
          where: { referrerCode: customer.referralCode, status: "COMPLETED" },
          select: { coinsAwarded: true },
        });
        const referralEarned = referralLogs.reduce((sum, r) => sum + r.coinsAwarded, 0);

        return {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          currentCoins: customer.coins,
          totalEarned: earned,
          totalUsed: used,
          referralEarned: referralEarned,
        };
      })
    );

    return NextResponse.json({ customers: customersWithCoinsData });
  } catch (error) {
    console.error("GET coins error:", error);
    return NextResponse.json({ error: "Failed to fetch coins data" }, { status: 500 });
  }
}