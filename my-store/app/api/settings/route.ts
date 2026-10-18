import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Settings lana
export async function GET() {
  try {
    let settings = await prisma.settings.findFirst();
    
    // Agar pehli baar khula hai, to default settings bana do
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          storeName: "S.S Collection",
          contactEmail: "contact@sscollection.pk",
          contactPhone: "+92 300 0000000",
          address: "Karachi, Pakistan",
          freeShippingThreshold: 5000,
          shippingFee: 250,
        },
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

// POST: Settings save karna
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const existing = await prisma.settings.findFirst();

    if (existing) {
      await prisma.settings.update({
        where: { id: existing.id },
        data: body,
      });
    } else {
      await prisma.settings.create({ data: body });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}