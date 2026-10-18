import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/products — saare products
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

// POST /api/products — naya product add karo
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
    } = body;

    // Validation
    if (!name || !description || !category || !price || !image) {
      return NextResponse.json(
        { error: "Missing required fields: name, description, category, price, image" },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        name: String(name).trim(),
        description: String(description).trim(),
        category: String(category).trim(),
        price: Number(price),
        salePrice: salePrice ? Number(salePrice) : null,
        stock: stock ? Number(stock) : 0,
        image: String(image).trim(),
        rating: 4.5,
        reviews: 0,
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("POST /api/products error:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}