import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/orders — saare orders (admin panel ke liye)
export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        items: true,
      },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("GET /api/orders error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

// POST /api/orders — naya order place karo (customer se)
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      customerName,
      customerPhone,
      customerAddress,
      customerEmail,
      notes,
      items,
    } = body;

    // Validation
    if (!customerName || !customerPhone || !customerAddress) {
      return NextResponse.json(
        { error: "Name, phone, and address are required" },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Order must have at least one item" },
        { status: 400 }
      );
    }

    // Subtotal calculate karo
    const subtotal = items.reduce(
      (sum: number, item: any) =>
        sum + Number(item.price) * Number(item.quantity),
      0
    );

    // Shipping — Rs. 5000 se zyada pe FREE, warna Rs. 250
    const shipping = subtotal > 5000 ? 0 : 250;
    const total = subtotal + shipping;

    // Order number banao
    const orderNumber = `SS-${new Date().getFullYear()}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerName: String(customerName).trim(),
        customerPhone: String(customerPhone).trim(),
        customerAddress: String(customerAddress).trim(),
        customerEmail: customerEmail ? String(customerEmail).trim() : null,
        notes: notes ? String(notes).trim() : null,
        subtotal,
        shipping,
        total,
        status: "PENDING",
        paymentMethod: "COD",
        items: {
          create: items.map((item: any) => ({
            productId: String(item.productId),
            name: String(item.name),
            price: Number(item.price),
            quantity: Number(item.quantity),
            image: String(item.image),
          })),
        },
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error("POST /api/orders error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}