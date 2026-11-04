import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Saare referrals ka data
export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { totalReferrals: "desc" },
    });

    const customersWithLogs = await Promise.all(
      customers.map(async (customer) => {
        const logs = await prisma.referralLog.findMany({
          where: { referrerCode: customer.referralCode },
        });

        const totalCoinsEarned = logs
          .filter((l) => l.status === "COMPLETED")
          .reduce((sum, l) => sum + l.coinsAwarded, 0);

        return {
          ...customer,
          logs: logs,
          totalReferralCoinsEarned: totalCoinsEarned,
        };
      })
    );

    return NextResponse.json({ customers: customersWithLogs });
  } catch (error) {
    console.error("GET referrals error:", error);
    return NextResponse.json({ error: "Failed to fetch referrals" }, { status: 500 });
  }
}

// POST: Refer karne ka status on/off karo
export async function POST(request: Request) {
  try {
    const { customerId, canRefer } = await request.json();

    const updated = await prisma.customer.update({
      where: { id: customerId },
      data: { canRefer },
    });

    return NextResponse.json({ success: true, customer: updated });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}