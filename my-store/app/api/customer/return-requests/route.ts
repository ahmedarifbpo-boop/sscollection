
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const HISTORY_COOKIE = "ss-order-history";

export async function POST(request: Request) {
  try {
    // Verify customer history cookie
    const cookieHeader = request.headers.get("cookie") || "";

    const cookie = cookieHeader
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${HISTORY_COOKIE}=`));

    if (!cookie) {
      return NextResponse.json(
        { error: "Please access your order history first." },
        { status: 401 }
      );
    }

    let token: string;

    try {
      token = decodeURIComponent(
        cookie.slice(HISTORY_COOKIE.length + 1)
      );
    } catch {
      return NextResponse.json(
        { error: "Invalid session." },
        { status: 401 }
      );
    }

    if (!/^[a-f0-9]{64}$/i.test(token)) {
      return NextResponse.json(
        { error: "Invalid session." },
        { status: 401 }
      );
    }

    const formData = await request.formData();

    const orderId = String(formData.get("orderId") || "").trim();
    const reason = String(formData.get("reason") || "").trim();
    const details = String(formData.get("details") || "").trim();

    const images = formData
      .getAll("images")
      .filter((value): value is string => typeof value === "string");

    const videos = formData
      .getAll("videos")
      .filter((value): value is string => typeof value === "string");

    if (!orderId || !reason) {
      return NextResponse.json(
        { error: "Order and return reason are required." },
        { status: 400 }
      );
    }

    if (reason.length > 500 || details.length > 2000) {
      return NextResponse.json(
        { error: "Text is too long." },
        { status: 400 }
      );
    }

    // Verify order ownership and get original customer details
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        historyToken: token,
      },
      select: {
        id: true,
        customerPhone: true,
        customerEmail: true,
        customerAddress: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found." },
        { status: 404 }
      );
    }

    // Use edited customer details; fallback to order details
    // if a field was not sent by the form.
    const customerPhone = String(
      formData.has("customerPhone")
        ? formData.get("customerPhone") || ""
        : order.customerPhone
    ).trim();

    const customerEmail = String(
      formData.has("customerEmail")
        ? formData.get("customerEmail") || ""
        : order.customerEmail || ""
    ).trim();

    const customerAddress = String(
      formData.has("customerAddress")
        ? formData.get("customerAddress") || ""
        : order.customerAddress
    ).trim();

    if (!customerPhone || !customerAddress) {
      return NextResponse.json(
        { error: "Phone number and address are required." },
        { status: 400 }
      );
    }

    if (
      customerPhone.length > 30 ||
      customerAddress.length > 1000 ||
      customerEmail.length > 254
    ) {
      return NextResponse.json(
        { error: "Customer details are too long." },
        { status: 400 }
      );
    }

    if (
      customerEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)
    ) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // Prevent duplicate return requests
    const existingRequest = await prisma.returnRequest.findFirst({
      where: { orderId },
      select: { id: true },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: "A return request already exists for this order." },
        { status: 409 }
      );
    }

    const returnRequest = await prisma.returnRequest.create({
      data: {
        orderId,
        reason,
        details: details || null,

        customerPhone,
        customerEmail: customerEmail || null,
        customerAddress,

        images,
        videos,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Return request submitted successfully.",
        returnRequest,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/customer/return-requests:", error);

    return NextResponse.json(
      { error: "Failed to submit return request." },
      { status: 500 }
    );
  }
}
