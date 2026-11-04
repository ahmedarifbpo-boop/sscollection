import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { email, phone } = await request.json();

    if (!email || !phone) {
      return NextResponse.json({ error: "Email and phone are required" }, { status: 400 });
    }

    // Customer ko email aur phone dono se dhoondo
    const customer = await prisma.customer.findFirst({
      where: {
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
      },
    });

    if (!customer) {
      return NextResponse.json({ error: "Invalid email or phone number. Account not found." }, { status: 401 });
    }

    // Login successful
    return NextResponse.json({ success: true, customer });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Failed to login" }, { status: 500 });
  }
}