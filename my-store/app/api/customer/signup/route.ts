import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { name, email, phone, referredBy } = await request.json();

    if (!name || !email || !phone) {
      return NextResponse.json({ error: "Name, email and phone are required" }, { status: 400 });
    }

    // Check karo ke account pehle se hai ya nahi
    const existing = await prisma.customer.findFirst({
      where: {
        OR: [
          { email: email.trim().toLowerCase() },
          { phone: phone.trim() }
        ]
      },
    });

    if (existing) {
      return NextResponse.json({ error: "Account already exists. Please login." }, { status: 400 });
    }

    // Naya referral code banao
    const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
    const referralCode = `SS-${randomStr}`;

    // Database mein customer save karo
    const customer = await prisma.customer.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        referralCode,
        referredBy: referredBy || null,
        hasOrdered: false,
        canRefer: true,
      },
    });

    return NextResponse.json({ success: true, customer }, { status: 201 });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}