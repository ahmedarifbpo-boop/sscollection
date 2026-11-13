
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/admin-auth";

export async function GET(request: Request) {
  try {
    // Admin authentication
    const auth = await verifyAdminRequest(request);

    if (!auth) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const customers = await prisma.customer.findMany({
      orderBy: { coins: "desc" },
    });

    // Har customer ke coins ka hisaab
    const customersWithCoinsData = await Promise.all(
      customers.map(async (customer) => {
        // 1. Total Earned Coins (Delivered orders se 3%)
        const deliveredOrders = await prisma.order.findMany({
          where: {
            customerId: customer.id,
            status: "DELIVERED",
          },
          select: {
            coinsEarned: true,
          },
        });

        const earned = deliveredOrders.reduce(
          (sum, order) => sum + order.coinsEarned,
          0
        );

        // 2. Total Used Coins
        const ordersWithUsedCoins = await prisma.order.findMany({
          where: {
            customerId: customer.id,
            coinsUsed: { gt: 0 },
          },
          select: {
            coinsUsed: true,
          },
        });

        const used = ordersWithUsedCoins.reduce(
          (sum, order) => sum + order.coinsUsed,
          0
        );

        // 3. Referral Coins
        const referralLogs = await prisma.referralLog.findMany({
          where: {
            referrerCode: customer.referralCode,
            status: "COMPLETED",
          },
          select: {
            coinsAwarded: true,
          },
        });

        const referralEarned = referralLogs.reduce(
          (sum, referral) => sum + referral.coinsAwarded,
          0
        );

        return {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          currentCoins: customer.coins,
          totalEarned: earned,
          totalUsed: used,
          referralEarned,
        };
      })
    );

    return NextResponse.json({
      customers: customersWithCoinsData,
    });
  } catch (error) {
    console.error("GET coins error:", error);

    return NextResponse.json(
      { error: "Failed to fetch coins data" },
      { status: 500 }
    );
  }
}
