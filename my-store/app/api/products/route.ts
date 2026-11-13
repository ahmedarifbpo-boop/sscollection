
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// SEO-friendly slug
function createSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// GET /api/products
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error("GET /api/products error:", error);

    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// POST /api/products
export async function POST(request: Request) {
  try {
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
    } = body;

    // Required fields
    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof description !== "string" ||
      !description.trim() ||
      typeof category !== "string" ||
      !category.trim() ||
      price === undefined ||
      price === null ||
      price === ""
    ) {
      return NextResponse.json(
        {
          error: "Name, description, category and price are required",
        },
        { status: 400 }
      );
    }

    // Validate multiple images
    if (images !== undefined && !Array.isArray(images)) {
      return NextResponse.json(
        { error: "Images must be an array" },
        { status: 400 }
      );
    }

    const productImages: string[] = Array.isArray(images)
      ? images.filter(
          (item: unknown): item is string =>
            typeof item === "string" && item.trim().length > 0
        ).map((item: string) => item.trim())
      : [];

    // Support old frontend using single image
    const singleImage =
      typeof image === "string" ? image.trim() : "";

    // First image becomes main image
    const mainImage = productImages[0] || singleImage || "";

    // Validate optional video
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

    const productVideo =
      typeof video === "string" && video.trim()
        ? video.trim()
        : null;

    const productPrice = Number(price);

    const productSalePrice =
      salePrice === undefined ||
      salePrice === null ||
      salePrice === ""
        ? null
        : Number(salePrice);

    const productStock =
      stock === undefined ||
      stock === null ||
      stock === ""
        ? 0
        : Number(stock);

    // Price and stock validation
    if (
      !Number.isFinite(productPrice) ||
      productPrice <= 0 ||
      !Number.isSafeInteger(productStock) ||
      productStock < 0
    ) {
      return NextResponse.json(
        { error: "Invalid price or stock value" },
        { status: 400 }
      );
    }

    if (
      productSalePrice !== null &&
      (!Number.isFinite(productSalePrice) ||
        productSalePrice <= 0 ||
        productSalePrice >= productPrice)
    ) {
      return NextResponse.json(
        {
          error:
            "Sale price must be positive and less than regular price",
        },
        { status: 400 }
      );
    }

    const productName = name.trim();
    const baseSlug = createSlug(productName);

    if (!baseSlug) {
      return NextResponse.json(
        {
          error:
            "Product name must contain English letters or numbers",
        },
        { status: 400 }
      );
    }

    // Generate unique slug
    let slug = baseSlug;
    let counter = 1;

    while (
      await prisma.product.findUnique({
        where: { slug },
        select: { id: true },
      })
    ) {
      counter++;
      slug = `${baseSlug}-${counter}`;
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        name: productName,
        slug,
        description: description.trim(),
        category: category.trim(),
        price: productPrice,
        salePrice: productSalePrice,
        stock: productStock,

        image: mainImage,
        images: productImages,
        video: productVideo,

        // Actual ratings will be calculated
        // from customer reviews later.
        rating: 0,
        reviews: 0,
      },
    });

    return NextResponse.json(
      { product },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/products error:", error);

    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
