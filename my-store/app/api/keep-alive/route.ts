import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Database se ek simple query (count) chalayenge taake activity generate ho
    const productCount = await prisma.product.count();
    return NextResponse.json({ status: "alive", products: productCount });
  } catch (error) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}