import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    const customer = await prisma.customer.findUnique({ where: { email } });
    if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

    // Total Earned Coins calculate karo
    const deliveredOrders = await prisma.order.findMany({
      where: { customerId: customer.id, status: "DELIVERED" },
      select: { coinsEarned: true },
    });
    const totalEarned = deliveredOrders.reduce((sum, order) => sum + order.coinsEarned, 0);

    // Referral Coins calculate karo
    const referralLogs = await prisma.referralLog.findMany({
      where: { referrerCode: customer.referralCode, status: "COMPLETED" },
      select: { coinsAwarded: true },
    });
    const totalReferralCoins = referralLogs.reduce((sum, log) => sum + log.coinsAwarded, 0);

    // Total Used Coins calculate karo
    const ordersWithUsedCoins = await prisma.order.findMany({
      where: { customerId: customer.id, coinsUsed: { gt: 0 } },
      select: { coinsUsed: true },
    });
    const totalUsed = ordersWithUsedCoins.reduce((sum, o) => sum + o.coinsUsed, 0);

    return NextResponse.json({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      totalCoins: customer.coins,
      earnedCoins: totalEarned,
      referralCoins: totalReferralCoins,
      totalCoinsUsed: totalUsed,
      referralCode: customer.referralCode,
      totalReferrals: customer.totalReferrals, // 👈 Ye add kiya hai
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}