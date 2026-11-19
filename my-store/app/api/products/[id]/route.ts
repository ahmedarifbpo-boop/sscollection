
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/admin-auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/products/[id]
// Public: private cost hidden
// Admin: private cost included for editing
export async function GET(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    const auth = await verifyAdminRequest(request);

    const product = auth
      ? await prisma.product.findUnique({
          where: { id },
        })
      : await prisma.product.findUnique({
          where: { id },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            category: true,
            price: true,
            salePrice: true,
            stock: true,
            isManuallyOutOfStock: true,
            image: true,
            images: true,
            video: true,
            rating: true,
            reviews: true,
            metaTitle: true,
            metaDescription: true,
            createdAt: true,
            updatedAt: true,
          },
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
  { params }: RouteContext
) {
  try {
    const auth = await verifyAdminRequest(request);

    if (!auth) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const {
      name,
      description,
      category,
      price,
      salePrice,
      costPrice,
      stock,
      image,
      images,
      video,
      isManuallyOutOfStock,
      rating,
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

    // Validate rating
    const updatedRating =
      rating === undefined
        ? existing.rating
        : Number(rating);

    if (
      !Number.isFinite(updatedRating) ||
      updatedRating < 0 ||
      updatedRating > 5 ||
      updatedRating * 2 !== Math.round(updatedRating * 2)
    ) {
      return NextResponse.json(
        {
          error: "Rating must be between 0 and 5 in increments of 0.5",
        },
        { status: 400 }
      );
    }

    // Validate text fields
    if (
      name !== undefined &&
      (typeof name !== "string" || !name.trim())
    ) {
      return NextResponse.json(
        { error: "Invalid product name" },
        { status: 400 }
      );
    }

    if (
      description !== undefined &&
      (typeof description !== "string" || !description.trim())
    ) {
      return NextResponse.json(
        { error: "Invalid description" },
        { status: 400 }
      );
    }

    if (
      category !== undefined &&
      (typeof category !== "string" || !category.trim())
    ) {
      return NextResponse.json(
        { error: "Invalid category" },
        { status: 400 }
      );
    }

    // Validate regular price
    const updatedPrice =
      price !== undefined ? Number(price) : existing.price;

    if (!Number.isFinite(updatedPrice) || updatedPrice <= 0) {
      return NextResponse.json(
        { error: "Price must be a positive number" },
        { status: 400 }
      );
    }

    // Validate sale price
    const updatedSalePrice =
      salePrice === undefined
        ? existing.salePrice
        : salePrice === null || salePrice === ""
          ? null
          : Number(salePrice);

    if (
      updatedSalePrice !== null &&
      (!Number.isFinite(updatedSalePrice) ||
        updatedSalePrice <= 0 ||
        updatedSalePrice >= updatedPrice)
    ) {
      return NextResponse.json(
        {
          error:
            "Sale price must be positive and less than regular price",
        },
        { status: 400 }
      );
    }

    // Validate actual purchase cost
    const updatedCostPrice =
      costPrice === undefined
        ? existing.costPrice
        : Number(costPrice);

    if (
      !Number.isFinite(updatedCostPrice) ||
      updatedCostPrice < 0
    ) {
      return NextResponse.json(
        { error: "Cost price must be a valid non-negative number" },
        { status: 400 }
      );
    }

    // Validate stock
    const updatedStock =
      stock !== undefined ? Number(stock) : existing.stock;

    if (
      !Number.isSafeInteger(updatedStock) ||
      updatedStock < 0
    ) {
      return NextResponse.json(
        { error: "Stock must be a non-negative whole number" },
        { status: 400 }
      );
    }

    // Validate video
    if (
      video !== undefined &&
      video !== null &&
      typeof video !== "string"
    ) {
      return NextResponse.json(
        { error: "Invalid video value" },
        { status: 400 }
      );
    }

    // Validate images
    let updatedImages: string[] | undefined;
    let updatedImage: string | undefined;

    if (images !== undefined) {
      if (
        !Array.isArray(images) ||
        !images.every((item) => typeof item === "string")
      ) {
        return NextResponse.json(
          { error: "Images must be an array of strings" },
          { status: 400 }
        );
      }

      updatedImages = images
        .map((item: string) => item.trim())
        .filter(Boolean);

      updatedImage = updatedImages[0] || "";
    } else if (image !== undefined) {
      if (typeof image !== "string") {
        return NextResponse.json(
          { error: "Invalid image value" },
          { status: 400 }
        );
      }

      updatedImage = image.trim();

      updatedImages =
        existing.images.length > 0
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
            ? name.trim()
            : undefined,

        description:
          description !== undefined
            ? description.trim()
            : undefined,

        category:
          category !== undefined
            ? category.trim()
            : undefined,

        price:
          price !== undefined
            ? updatedPrice
            : undefined,

        salePrice:
          salePrice !== undefined
            ? updatedSalePrice
            : undefined,

        costPrice:
          costPrice !== undefined
            ? updatedCostPrice
            : undefined,

        stock:
          stock !== undefined
            ? updatedStock
            : undefined,

        rating:
          rating !== undefined
            ? updatedRating
            : undefined,

        isManuallyOutOfStock:
          isManuallyOutOfStock !== undefined
            ? isManuallyOutOfStock
            : undefined,

        image: updatedImage,
        images: updatedImages,

        video:
          video === null || video === ""
            ? video !== undefined
              ? null
              : undefined
            : video !== undefined
              ? video.trim()
              : undefined,
      },
    });

    // Private cost must not be returned in PUT response.
    const { costPrice: _privateCostPrice, ...publicProduct } = product;

    return NextResponse.json({ product: publicProduct });
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
  { params }: RouteContext
) {
  try {
    const auth = await verifyAdminRequest(request);

    if (!auth) {
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
