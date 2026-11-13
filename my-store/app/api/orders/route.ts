
import { NextResponse } from "next/server";
import { randomBytes, randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import { generateOrderEmail } from "@/lib/email-template";
import { verifyAdminRequest } from "@/lib/admin-auth";

export const runtime = "nodejs";

const HISTORY_COOKIE = "ss-order-history";
const HISTORY_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export async function GET(request: Request) {
  try {
    if (!verifyAdminRequest(request)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        items: true,
        customer: true,
      },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("GET /api/orders:", error);

    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

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
      coinsUsed = 0,
    } = body;

    // Validate customer details
    if (
      typeof customerName !== "string" ||
      !customerName.trim() ||
      typeof customerPhone !== "string" ||
      !customerPhone.trim() ||
      typeof customerAddress !== "string" ||
      !customerAddress.trim()
    ) {
      return NextResponse.json(
        { error: "Name, phone, and address are required" },
        { status: 400 }
      );
    }

    // Validate order items
    if (!Array.isArray(items) || !items.length || items.length > 50) {
      return NextResponse.json(
        { error: "Invalid order items" },
        { status: 400 }
      );
    }

    const usedCoins = Number(coinsUsed);

    if (!Number.isFinite(usedCoins) || usedCoins < 0) {
      return NextResponse.json(
        { error: "Invalid coins amount" },
        { status: 400 }
      );
    }

    // Normalize email
    const normalizedEmail =
      typeof customerEmail === "string" && customerEmail.trim()
        ? customerEmail.trim().toLowerCase()
        : null;

    if (
      normalizedEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Combine duplicate products
    const productQuantities = new Map<string, number>();

    for (const item of items) {
      const productId = String(item?.productId ?? "").trim();
      const quantity = Number(item?.quantity);

      if (
        !productId ||
        !Number.isSafeInteger(quantity) ||
        quantity < 1 ||
        quantity > 1000
      ) {
        return NextResponse.json(
          { error: "Invalid product or quantity" },
          { status: 400 }
        );
      }

      const nextQuantity =
        (productQuantities.get(productId) || 0) + quantity;

      if (nextQuantity > 1000) {
        return NextResponse.json(
          { error: "Product quantity limit exceeded" },
          { status: 400 }
        );
      }

      productQuantities.set(productId, nextQuantity);
    }

    const productIds = [...productQuantities.keys()];

    // Fetch products, settings and existing customer
    const [products, settings, customer] = await Promise.all([
      prisma.product.findMany({
        where: { id: { in: productIds } },
      }),
      prisma.settings.findFirst(),
      normalizedEmail
        ? prisma.customer.findUnique({
            where: { email: normalizedEmail },
          })
        : Promise.resolve(null),
    ]);

    if (products.length !== productIds.length) {
      return NextResponse.json(
        { error: "One or more products do not exist" },
        { status: 400 }
      );
    }

    if (usedCoins > 0 && !customer) {
      return NextResponse.json(
        { error: "Customer account is required to use coins" },
        { status: 400 }
      );
    }

    // Calculate subtotal using database prices
    const productMap = new Map(products.map((p) => [p.id, p]));

    let subtotal = 0;

    const orderItems = productIds.map((productId) => {
      const product = productMap.get(productId)!;
      const quantity = productQuantities.get(productId)!;
      const price = Number(product.salePrice ?? product.price);

      if (!Number.isFinite(price) || price < 0) {
        throw new Error("INVALID_PRODUCT_PRICE");
      }

      subtotal += price * quantity;

      return {
        productId,
        name: product.name,
        price,
        quantity,
        image: product.image,
      };
    });

    subtotal = Math.round(subtotal * 100) / 100;

    // Shipping calculation
    const freeShippingEnabled = settings?.enableFreeShipping ?? true;
    const freeShippingThreshold = settings?.freeShippingThreshold ?? 5000;
    const shippingFee = settings?.shippingFee ?? 250;

    const shipping =
      freeShippingEnabled && subtotal >= freeShippingThreshold
        ? 0
        : shippingFee;

    const totalBeforeCoins = subtotal + shipping;

    if (usedCoins > totalBeforeCoins) {
      return NextResponse.json(
        { error: "Coins cannot exceed the order total" },
        { status: 400 }
      );
    }

    const finalTotal =
      Math.round((totalBeforeCoins - usedCoins) * 100) / 100;

    const coinsEarned = Math.round(finalTotal * 0.03 * 100) / 100;

    // Generate order number
    const orderNumber = `SS-${new Date().getFullYear()}-${randomUUID()
      .replace(/-/g, "")
      .slice(0, 12)
      .toUpperCase()}`;

    const verificationToken = normalizedEmail ? randomUUID() : null;

    // Reuse valid browser history token or generate a new one
    const cookieHeader = request.headers.get("cookie") || "";

    const existingCookie = cookieHeader
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${HISTORY_COOKIE}=`));

    let historyToken: string | null = null;

    if (existingCookie) {
      try {
        const existingToken = decodeURIComponent(
          existingCookie.slice(HISTORY_COOKIE.length + 1)
        );

        if (/^[a-f0-9]{64}$/i.test(existingToken)) {
          historyToken = existingToken;
        }
      } catch {
        historyToken = null;
      }
    }

    if (!historyToken) {
      historyToken = randomBytes(32).toString("hex");
    }

    // Create order and update customer coins in transaction
    const order = await prisma.$transaction(
      async (tx) => {
        if (customer) {
          const update = await tx.customer.updateMany({
            where: {
              id: customer.id,
              ...(usedCoins > 0
                ? { coins: { gte: usedCoins } }
                : {}),
            },
            data: {
              ...(usedCoins > 0
                ? { coins: { decrement: usedCoins } }
                : {}),
              hasOrdered: true,
            },
          });

          if (update.count !== 1) {
            throw new Error(
              usedCoins > 0
                ? "NOT_ENOUGH_COINS"
                : "CUSTOMER_UPDATE_FAILED"
            );
          }
        }

        return tx.order.create({
          data: {
            orderNumber,
            customerName: customerName.trim(),
            customerPhone: customerPhone.trim(),
            customerAddress: customerAddress.trim(),
            customerEmail: normalizedEmail,
            notes:
              typeof notes === "string" && notes.trim()
                ? notes.trim()
                : null,

            subtotal,
            shipping,
            total: finalTotal,

            coinsUsed: usedCoins,
            coinsEarned,

            status: "PENDING",
            paymentMethod: "COD",

            customerId: customer?.id ?? null,
            verificationToken,

            // Save history token directly on this order
            historyToken,

            items: {
              create: orderItems,
            },
          },
          include: {
            items: true,
          },
        });
      },
      {
        maxWait: 10000,
        timeout: 15000,
      }
    );

    // Send order email after successful order creation
    if (
      normalizedEmail &&
      verificationToken &&
      process.env.RESEND_API_KEY
    ) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);

        const baseUrl = (
          process.env.NEXT_PUBLIC_BASE_URL ||
          "https://sscollection.online"
        ).replace(/\/$/, "");

        const verifyLink =
          `${baseUrl}/verify-order/${verificationToken}`;

        await resend.emails.send({
          from: "S.S Collection <onboarding@resend.dev>",
          to: normalizedEmail,
          subject: `Order Confirmation - ${orderNumber}`,
          html: generateOrderEmail(
            orderNumber,
            customerName.trim(),
            verifyLink,
            order.total
          ),
        });
      } catch (emailError) {
        console.error(
          "Order email sending failed:",
          emailError
        );
      }
    }

    // Set private history cookie
    const response = NextResponse.json(
      {
        success: true,
        order,
      },
      { status: 201 }
    );

    response.cookies.set(HISTORY_COOKIE, historyToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: HISTORY_COOKIE_MAX_AGE,
    });

    return response;
  } catch (error) {
    console.error("POST /api/orders:", error);

    const message =
      error instanceof Error ? error.message : "";

    const errors: Record<string, string> = {
      INVALID_PRODUCT_PRICE: "Invalid product price",
      NOT_ENOUGH_COINS: "Not enough coins available",
      CUSTOMER_UPDATE_FAILED: "Customer account could not be updated",
    };

    return NextResponse.json(
      {
        error: errors[message] || "Failed to create order",
      },
      {
        status: errors[message] ? 400 : 500,
      }
    );
  }
}
