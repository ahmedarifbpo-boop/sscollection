import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/admin-auth";


// GET: Settings lana (Public)
export async function GET() {
  try {
    let settings = await prisma.settings.findFirst();

    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          storeName: "S.S Collection",
          contactEmail: "contact@sscollection.pk",
          contactPhone: "+92 300 0000000",
          address: "Karachi, Pakistan",

          // Free Shipping default OFF
          freeShippingThreshold: null,
          shippingFee: 250,
          enableFreeShipping: false,

          logoUrl: "",
          adsenseCode: "",
          adsenseEnabled: false,
        },
      });
    }

    return NextResponse.json(
      { settings },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("GET settings error:", error);

    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// POST: Settings save karna (Admin Only)
export async function POST(request: Request) {
  try {
    if (!verifyAdminRequest(request)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Sirf wohi fields update hongi jo request mein bheji gayi hain.
    const dataToUpdate: Record<string, any> = {};

    if (body.storeName !== undefined)
      dataToUpdate.storeName = body.storeName;

    if (body.contactEmail !== undefined)
      dataToUpdate.contactEmail = body.contactEmail;

    if (body.contactPhone !== undefined)
      dataToUpdate.contactPhone = body.contactPhone;

    if (body.address !== undefined)
      dataToUpdate.address = body.address;

    if (body.freeShippingThreshold !== undefined) {
      const value = Number(body.freeShippingThreshold);
      if (!Number.isFinite(value)) {
        return NextResponse.json(
          { error: "Invalid free shipping threshold" },
          { status: 400 }
        );
      }
      dataToUpdate.freeShippingThreshold = value;
    }

    if (body.shippingFee !== undefined) {
      const value = Number(body.shippingFee);
      if (!Number.isFinite(value)) {
        return NextResponse.json(
          { error: "Invalid shipping fee" },
          { status: 400 }
        );
      }
      dataToUpdate.shippingFee = value;
    }

    if (body.enableFreeShipping !== undefined)
      dataToUpdate.enableFreeShipping = Boolean(body.enableFreeShipping);

    if (body.logoUrl !== undefined)
      dataToUpdate.logoUrl = body.logoUrl;

    if (body.adsenseCode !== undefined) {
      dataToUpdate.adsenseCode =
        String(body.adsenseCode).trim() || null;
    }

    if (body.adsenseEnabled !== undefined)
      dataToUpdate.adsenseEnabled = Boolean(body.adsenseEnabled);

    const existing = await prisma.settings.findFirst();

    if (existing) {
      await prisma.settings.update({
        where: { id: existing.id },
        data: dataToUpdate,
      });
    } else {
      await prisma.settings.create({
        data: dataToUpdate,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST settings error:", error);

    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}