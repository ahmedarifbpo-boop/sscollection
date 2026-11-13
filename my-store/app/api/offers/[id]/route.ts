
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/admin-auth";

// DELETE /api/offers/[id] - Admin only
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminId = verifyAdminRequest(request);

    if (!adminId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const existing = await prisma.offer.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Offer not found" },
        { status: 404 }
      );
    }

    await prisma.offer.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/offers/[id] error:", error);

    return NextResponse.json(
      { error: "Failed to delete offer" },
      { status: 500 }
    );
  }
}
