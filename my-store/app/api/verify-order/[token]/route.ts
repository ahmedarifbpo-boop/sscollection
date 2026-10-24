import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const order = await prisma.order.findUnique({
      where: { verificationToken: token },
    });

    if (!order) {
      return NextResponse.json({ error: "Invalid token" }, { status: 404 });
    }

    // Order ko verified mark karo aur token hata do (security)
    await prisma.order.update({
      where: { id: order.id },
      data: {
        isVerified: true,
        verificationToken: null, 
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to verify" }, { status: 500 });
  }
}