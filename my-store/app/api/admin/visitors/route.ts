import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const visitors = await prisma.visitorLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ visitors });
  } catch (error: any) {
    console.error("GET ERROR:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { ids } = await request.json();
    if (!ids || ids.length === 0) return NextResponse.json({ error: "No IDs" }, { status: 400 });

    await prisma.visitorLog.deleteMany({
      where: { id: { in: ids } },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}