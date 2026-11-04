import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { email, referralCode } = await request.json();

    if (!email || !referralCode) {
      return NextResponse.json({ error: "Email and referral code required" }, { status: 400 });
    }

    const cleanCode = referralCode.trim().toUpperCase();

    // Security 5: Format Check
    if (!cleanCode.startsWith("SS-")) {
      return NextResponse.json({ error: "Invalid format. Code must start with SS-" }, { status: 400 });
    }

    // Customer dhoondo
    const customer = await prisma.customer.findUnique({ where: { email } });
    if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

    // Security 2: Ek Customer = Ek Referral
    if (customer.referredBy) {
      return NextResponse.json({ error: "You have already applied a referral code." }, { status: 400 });
    }

    // Security 4: Pehla Order Valid (Agar pehle order kar diya hai to code apply nahi hoga)
    if (customer.hasOrdered) {
      return NextResponse.json({ error: "Referral code can only be applied before your first order." }, { status: 400 });
    }

    // Referrer dhoondo
    const referrer = await prisma.customer.findUnique({ where: { referralCode: cleanCode } });
    if (!referrer) return NextResponse.json({ error: "Invalid referral code." }, { status: 400 });

    // Security 1: Self-Referral Block
    if (referrer.email === email || referrer.phone === customer.phone) {
      return NextResponse.json({ error: "You cannot use your own code." }, { status: 400 });
    }

    // Code Apply karo
    await prisma.customer.update({
      where: { id: customer.id },
      data: { referredBy: cleanCode },
    });

    // ReferralLog banao (PENDING)
    await prisma.referralLog.create({
      data: {
        referrerCode: cleanCode,
        referredEmail: email,
        status: "PENDING",
        coinsAwarded: 0,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to apply code" }, { status: 500 });
  }
}