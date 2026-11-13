
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/admin-auth";

// GET: Saare referrals ka data (Admin only)
export async function GET(request: Request) {
  try {
    if (!verifyAdminRequest(request)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

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
          logs,
          totalReferralCoinsEarned: totalCoinsEarned,
        };
      })
    );

    return NextResponse.json({
      customers: customersWithLogs,
    });
  } catch (error) {
    console.error("GET referrals error:", error);

    return NextResponse.json(
      { error: "Failed to fetch referrals" },
      { status: 500 }
    );
  }
}

// POST: Refer karne ka status on/off karo (Admin only)
export async function POST(request: Request) {
  try {
    if (!verifyAdminRequest(request)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { customerId, canRefer } = await request.json();

    if (
      typeof customerId !== "string" ||
      typeof canRefer !== "boolean"
    ) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    const updated = await prisma.customer.update({
      where: { id: customerId },
      data: { canRefer },
    });

    return NextResponse.json({
      success: true,
      customer: updated,
    });
  } catch (error) {
    console.error("POST referrals error:", error);

    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 }
    );
  }
}
