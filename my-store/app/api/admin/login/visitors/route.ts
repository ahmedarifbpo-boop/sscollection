import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET all visitors
export async function GET() {
  try {
    const visitors = await prisma.visitorLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100, // Sirf last 100 dikhao taake load fast ho
    });
    return NextResponse.json({ visitors });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// DELETE selected visitors
export async function DELETE(request: Request) {
  try {
    const { ids } = await request.json();
    if (!ids || ids.length === 0) return NextResponse.json({ error: "No IDs" }, { status: 400 });

    await prisma.visitorLog.deleteMany({
      where: { id: { in: ids } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}