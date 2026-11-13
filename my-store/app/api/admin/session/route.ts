
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/admin-auth";

export async function GET(request: Request) {
  try {
    const session = verifyAdminRequest(request);

    if (!session) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }

    const admin = await prisma.admin.findUnique({
      where: { id: session.adminId },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!admin) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      admin,
    });
  } catch (error) {
    console.error("Session check error:", error);

    return NextResponse.json(
      { authenticated: false },
      { status: 500 }
    );
  }
}
