
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    if (!verifyAdminRequest(request)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const returnRequests = await prisma.returnRequest.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        order: {
          include: {
            items: true,
          },
        },
      },
    });

    return NextResponse.json({ returnRequests });
  } catch (error) {
    console.error("GET /api/admin/return-requests:", error);

    return NextResponse.json(
      { error: "Failed to fetch return requests" },
      { status: 500 }
    );
  }
}
