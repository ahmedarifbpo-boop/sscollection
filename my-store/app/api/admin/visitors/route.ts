
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

// GET: Visitors load karna
export async function GET(request: Request) {
  try {
    // Server-side admin authentication
    if (!verifyAdminRequest(request)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const visitors = await prisma.visitorLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    // Product IDs ko names mein convert karna
    const productIds = [
      ...new Set(
        visitors
          .map((visitor) => visitor.productId)
          .filter((id): id is string => Boolean(id))
      ),
    ];

    const products = productIds.length
      ? await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: {
            id: true,
            name: true,
          },
        })
      : [];

    const productMap = new Map(
      products.map((product) => [product.id, product.name])
    );

    const visitorsWithNames = visitors.map((visitor) => ({
      ...visitor,
      productName: visitor.productId
        ? productMap.get(visitor.productId) || null
        : null,
    }));

    return NextResponse.json(
      { visitors: visitorsWithNames },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/admin/visitors error:", error);

    return NextResponse.json(
      { error: "Failed to load visitor records" },
      { status: 500 }
    );
  }
}

// DELETE: Selected visitors delete karna
export async function DELETE(request: Request) {
  try {
    // Server-side admin authentication
    if (!verifyAdminRequest(request)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const ids = body?.ids;

    if (
      !Array.isArray(ids) ||
      ids.length === 0 ||
      !ids.every((id) => typeof id === "string" && id.length > 0)
    ) {
      return NextResponse.json(
        { error: "Valid visitor IDs are required" },
        { status: 400 }
      );
    }

    const result = await prisma.visitorLog.deleteMany({
      where: {
        id: { in: ids },
      },
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
    });
  } catch (error) {
    console.error("DELETE /api/admin/visitors error:", error);

    return NextResponse.json(
      { error: "Failed to delete visitor records" },
      { status: 500 }
    );
  }
}
