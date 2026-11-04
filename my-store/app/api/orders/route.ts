import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import { generateOrderEmail } from "@/lib/email-template";

// GET /api/orders — saare orders (admin panel ke liye)
export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        items: true,
        customer: true, // 👈 Customer ki detail bhi sath layein
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
      coinsUsed = 0, // 👈 Naya: Customer ne kitne coins use kiye
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

    // Shipping — Rs. 500000 se zyada pe FREE, warna Rs. 250
    const shipping = subtotal > 500000 ? 0 : 250;
    
    // Coins Deduct karo (Agar customer ne coins use kiye hain)
    const usedCoins = Number(coinsUsed);
    const totalBeforeCoins = subtotal + shipping;
    const finalTotal = Math.max(0, totalBeforeCoins - usedCoins); // Total 0 se kam nahi ho sakta

    // 3% Coins Earn calculate karo (Order ki value ka 3%)
    const coinsEarned = finalTotal * 0.03;

    // Order number banao
    const orderNumber = `SS-${new Date().getFullYear()}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;

    // Customer ko dhoondo agar email diya hai (taake uske coins deduct kar sakein aur order link karein)
    let customerId = null;
    if (customerEmail) {
      const customer = await prisma.customer.findUnique({
        where: { email: customerEmail },
      });
      if (customer) {
        customerId = customer.id;

        // Agar coins use kiye hain, to customer ke account se minus karo
        if (usedCoins > 0) {
          if (customer.coins < usedCoins) {
            return NextResponse.json({ error: "Not enough coins available" }, { status: 400 });
          }
          await prisma.customer.update({
            where: { id: customer.id },
            data: { coins: { decrement: usedCoins } },
          });
        }

        // Customer ko mark karo ke usne order kar diya hai (referral ke liye)
        await prisma.customer.update({
          where: { id: customer.id },
          data: { hasOrdered: true },
        });
      }
    }

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
        total: finalTotal,
        coinsUsed: usedCoins,        // 👈 Naya
        coinsEarned: coinsEarned,    // 👈 Naya
        status: "PENDING",
        paymentMethod: "COD",
        customerId,                  // 👈 Naya
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

    // 🟢 Email bhejne ke liye (Resend)
    try {
      if (customerEmail) {
        const resend = new Resend(process.env.RESEND_API_KEY);
        
        // Verification token generate karo
        const token = crypto.randomUUID();

        // Token database mein save karo
        await prisma.order.update({
          where: { id: order.id },
          data: { verificationToken: token },
        });

        // Verification Link banao
        const verifyLink = `https://sscollection-2iih.vercel.app/verify-order/${token}`;

        // Email bhejo
        await resend.emails.send({
          from: "S.S Collection <onboarding@resend.dev>",
          to: customerEmail,
          subject: `Order Confirmation - ${orderNumber}`,
          html: generateOrderEmail(orderNumber, customerName, verifyLink, finalTotal),
        });
      }
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
    }

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error("POST /api/orders error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}