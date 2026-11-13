
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/admin-auth";

// GET /api/products/[id] — public product detail
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { product },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/products/[id] error:", error);

    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

// PUT /api/products/[id] — admin only
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!verifyAdminRequest(request)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const {
      name,
      description,
      category,
      price,
      salePrice,
      stock,
      image,
      images,
      video,
      isManuallyOutOfStock,
    } = body;

    const existing = await prisma.product.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    if (
      isManuallyOutOfStock !== undefined &&
      typeof isManuallyOutOfStock !== "boolean"
    ) {
      return NextResponse.json(
        { error: "isManuallyOutOfStock must be a boolean" },
        { status: 400 }
      );
    }

    let updatedImages: string[] | undefined;
    let updatedImage: string | undefined;

    // Agar images array bheja gaya hai to usay complete gallery samjho
    if (images !== undefined) {
      if (!Array.isArray(images)) {
        return NextResponse.json(
          { error: "Images must be an array" },
          { status: 400 }
        );
      }

      updatedImages = images
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean);

      updatedImage = updatedImages[0] || "";
    } else if (image !== undefined) {
      updatedImage = String(image).trim();

      updatedImages = existing.images.length > 0
        ? updatedImage
          ? [updatedImage, ...existing.images.slice(1)]
          : existing.images.slice(1)
        : updatedImage
          ? [updatedImage]
          : [];
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name:
          name !== undefined
            ? String(name).trim()
            : undefined,

        description:
          description !== undefined
            ? String(description).trim()
            : undefined,

        category:
          category !== undefined
            ? String(category).trim()
            : undefined,

        price:
          price !== undefined
            ? Number(price)
            : undefined,

        salePrice:
          salePrice === null || salePrice === ""
            ? null
            : salePrice !== undefined
              ? Number(salePrice)
              : undefined,

        stock:
          stock !== undefined
            ? Number(stock)
            : undefined,

        // Manual Out of Stock toggle
        isManuallyOutOfStock:
          typeof isManuallyOutOfStock === "boolean"
            ? isManuallyOutOfStock
            : undefined,

        // Main image aur gallery synchronize rahengi
        image: updatedImage,
        images: updatedImages,

        // null ya empty string video remove karega
        video:
          video === null || video === ""
            ? null
            : video !== undefined
              ? String(video).trim()
              : undefined,
      },
    });

    return NextResponse.json({ product });
  } catch (error) {
    console.error("PUT /api/products/[id] error:", error);

    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] — admin only
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!verifyAdminRequest(request)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const existing = await prisma.product.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    await prisma.product.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/products/[id] error:", error);

    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
