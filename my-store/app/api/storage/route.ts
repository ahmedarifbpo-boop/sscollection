import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // PostgreSQL query jo database ka size MBs mein batati hai
    const result: any[] = await prisma.$queryRaw`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size,
             pg_database_size(current_database()) as bytes
    `;

    const size = result[0]?.size || "0 MB";
    const bytes = Number(result[0]?.bytes || 0);

    return NextResponse.json({ size, bytes });
  } catch (error) {
    console.error("Storage error:", error);
    return NextResponse.json({ error: "Failed to get storage" }, { status: 500 });
  }
}