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
          enableFreeShipping: true,
          logoUrl: "", // Default khali
        },
      });
    }

    // Cache bypass headers taake har baar naya data aaye
    return NextResponse.json({ settings }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error("GET settings error:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

// POST: Settings save karna (Logo, Shipping, Name waghera)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Sirf allowed fields ko database mein update karne ke liye pick karo
    const { 
      storeName, 
      contactEmail, 
      contactPhone, 
      address, 
      freeShippingThreshold, 
      shippingFee, 
      enableFreeShipping,
      logoUrl 
    } = body;

    const dataToUpdate = {
      storeName,
      contactEmail,
      contactPhone,
      address,
      freeShippingThreshold: Number(freeShippingThreshold),
      shippingFee: Number(shippingFee),
      enableFreeShipping: Boolean(enableFreeShipping),
      logoUrl, // 👈 Logo URL save hoga
    };

    const existing = await prisma.settings.findFirst();

    if (existing) {
      await prisma.settings.update({
        where: { id: existing.id },
        data: dataToUpdate,
      });
    } else {
      await prisma.settings.create({ data: dataToUpdate });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST settings error:", error);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}