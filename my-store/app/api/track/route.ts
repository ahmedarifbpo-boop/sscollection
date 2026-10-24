import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { page } = body;

    // IP address nikalna (Vercel headers se)
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : "Unknown IP";

    await prisma.visitorLog.create({
      data: {
        ip: ip,
        page: page || "/",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Track error:", error);
    return NextResponse.json({ error: "Failed to track" }, { status: 500 });
  }
}