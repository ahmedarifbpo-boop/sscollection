
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function dateRange(from: string, to: string) {
  // Date filters are interpreted in Pakistan time (UTC+5).
  const start = new Date(`${from}T00:00:00+05:00`);
  const end = new Date(`${to}T23:59:59.999+05:00`);
  return { gte: start, lte: end };
}

function validAmount(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

export async function GET(request: Request) {
  if (!verifyAdminRequest(request)) return unauthorized();

  try {
    const url = new URL(request.url);
    const today = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Karachi",
    });
    const from = url.searchParams.get("from") || `${today.slice(0, 7)}-01`;
    const to = url.searchParams.get("to") || today;

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(from) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(to) ||
      from > to
    ) {
      return NextResponse.json(
        { error: "Invalid date range." },
        { status: 400 }
      );
    }

    const range = dateRange(from, to);

    const [products, rows, settings, payments, columns, orders] =
      await Promise.all([
        prisma.product.findMany({
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            price: true,
            salePrice: true,
            costPrice: true,
            stock: true,
          },
        }),
        prisma.expenseSheetRow.findMany({
          where: { date: range },
          orderBy: [{ date: "asc" }, { createdAt: "asc" }],
        }),
        prisma.expenseSheetSettings.findUnique({
          where: { id: "main" },
        }),
        prisma.expenseSheetPayment.findMany({
          where: { date: range },
          orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        }),
        prisma.expenseSheetColumn.findMany({
          orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        }),
        prisma.order.findMany({
          where: {
            status: "DELIVERED",
            createdAt: range,
          },
          select: {
            id: true,
            orderNumber: true,
            createdAt: true,
            items: {
              select: {
                productId: true,
                name: true,
                price: true,
                actualCost: true,
                quantity: true,
              },
            },
          },
        }),
      ]);

    const salesMap = new Map<
      string,
      {
        date: string;
        productId: string;
        productName: string;
        quantity: number;
        salesAmount: number;
        actualCost: number;
      }
    >();

    for (const order of orders) {
      const date = order.createdAt.toLocaleDateString("en-CA", {
        timeZone: "Asia/Karachi",
      });

      for (const item of order.items) {
        const key = `${date}:${item.productId}`;
        const existing = salesMap.get(key);

        if (existing) {
          existing.quantity += item.quantity;
          existing.salesAmount += item.price * item.quantity;
          existing.actualCost += item.actualCost * item.quantity;
        } else {
          salesMap.set(key, {
            date,
            productId: item.productId,
            productName: item.name,
            quantity: item.quantity,
            salesAmount: item.price * item.quantity,
            actualCost: item.actualCost * item.quantity,
          });
        }
      }
    }

    return NextResponse.json({
      products,
      rows,
      settings: settings || {
        id: "main",
        accountBalance: 0,
        actualCountedBalance: 0,
      },
      payments,
      columns,
      sales: Array.from(salesMap.values()),
    });
  } catch (error) {
    console.error("Expense sheet GET error:", error);
    return NextResponse.json(
      { error: "Failed to load expense sheet." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!verifyAdminRequest(request)) return unauthorized();

  try {
    const body = await request.json();
    const action = String(body.action || "");

    if (action === "row") {
      const date = new Date(`${body.date}T12:00:00+05:00`);

      if (!body.date || Number.isNaN(date.getTime())) {
        return NextResponse.json(
          { error: "Valid date is required." },
          { status: 400 }
        );
      }

      let productName = String(body.productName || "");
      let actualPrice = validAmount(body.actualPrice);
      let websitePrice = validAmount(body.websitePrice);

      if (body.productId) {
        const product = await prisma.product.findUnique({
          where: { id: String(body.productId) },
          select: { name: true, costPrice: true, price: true },
        });

        if (!product) {
          return NextResponse.json(
            { error: "Product not found." },
            { status: 404 }
          );
        }

        productName = product.name;
        actualPrice = actualPrice ?? product.costPrice;
        websitePrice = websitePrice ?? product.price;
      }

      const personalExpense = validAmount(body.personalExpense);
      const businessExpense = validAmount(body.businessExpense);
      const fuelCharges = validAmount(body.fuelCharges);
      const deliveryCharges = validAmount(body.deliveryCharges);
      const discountSalePrice = validAmount(body.discountSalePrice);
      const discountQuantity = Number(body.discountQuantity ?? 0);

      if (
        [
          actualPrice,
          websitePrice,
          personalExpense,
          businessExpense,
          fuelCharges,
          deliveryCharges,
          discountSalePrice,
        ].some((value) => value === null) ||
        !Number.isInteger(discountQuantity) ||
        discountQuantity < 0
      ) {
        return NextResponse.json(
          { error: "Invalid numeric values." },
          { status: 400 }
        );
      }

      const row = await prisma.expenseSheetRow.create({
        data: {
          date,
          productId: body.productId ? String(body.productId) : null,
          productName,
          actualPrice: actualPrice!,
          websitePrice: websitePrice!,
          personalExpense: personalExpense!,
          businessExpense: businessExpense!,
          fuelCharges: fuelCharges!,
          deliveryCharges: deliveryCharges!,
          discountSalePrice: discountSalePrice!,
          discountQuantity,
          note: body.note ? String(body.note).slice(0, 1000) : null,
          customValues: body.customValues ?? undefined,
        },
      });

      return NextResponse.json({ row }, { status: 201 });
    }

    if (action === "settings") {
      const accountBalance = validAmount(body.accountBalance);
      const actualCountedBalance = validAmount(body.actualCountedBalance);

      if (accountBalance === null || actualCountedBalance === null) {
        return NextResponse.json(
          { error: "Invalid balance." },
          { status: 400 }
        );
      }

      const settings = await prisma.expenseSheetSettings.upsert({
        where: { id: "main" },
        create: { id: "main", accountBalance, actualCountedBalance },
        update: { accountBalance, actualCountedBalance },
      });

      return NextResponse.json({ settings });
    }

    if (action === "payment") {
      const amount = validAmount(body.amount);
      const person = String(body.person || "");
      const date = new Date(
        `${body.date || new Date().toLocaleDateString("en-CA", {
          timeZone: "Asia/Karachi",
        })}T12:00:00+05:00`
      );

      if (
        !["Ahmad", "Sidra"].includes(person) ||
        amount === null ||
        amount <= 0 ||
        Number.isNaN(date.getTime())
      ) {
        return NextResponse.json(
          { error: "Invalid payment details." },
          { status: 400 }
        );
      }

      const payment = await prisma.expenseSheetPayment.create({
        data: {
          person,
          amount,
          date,
          note: body.note ? String(body.note).slice(0, 500) : null,
        },
      });

      return NextResponse.json({ payment }, { status: 201 });
    }

    if (action === "column") {
      const name = String(body.name || "").trim();
      const kind = String(body.kind || "TEXT");

      if (
        !name ||
        name.length > 40 ||
        !["TEXT", "NUMBER"].includes(kind)
      ) {
        return NextResponse.json(
          { error: "Enter a valid column name and type." },
          { status: 400 }
        );
      }

      const position = await prisma.expenseSheetColumn.count();

      const column = await prisma.expenseSheetColumn.create({
        data: { name, kind, position },
      });

      return NextResponse.json({ column }, { status: 201 });
    }

    return NextResponse.json(
      { error: "Unknown action." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Expense sheet POST error:", error);

    return NextResponse.json(
      { error: "Failed to save expense sheet data." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  if (!verifyAdminRequest(request)) return unauthorized();

  try {
    const body = await request.json();
    const action = String(body.action || "");

    if (action === "row") {
      const id = String(body.id || "");

      const existing = await prisma.expenseSheetRow.findUnique({
        where: { id },
      });

      if (!existing) {
        return NextResponse.json(
          { error: "Row not found." },
          { status: 404 }
        );
      }

      const date = body.date
        ? new Date(`${body.date}T12:00:00+05:00`)
        : existing.date;

      const productId =
        body.productId === undefined
          ? existing.productId
          : body.productId || null;

      let productName =
        body.productName === undefined
          ? existing.productName
          : String(body.productName);

      let actualPrice = validAmount(
        body.actualPrice ?? existing.actualPrice
      );

      let websitePrice = validAmount(
        body.websitePrice ?? existing.websitePrice
      );

      if (body.productId) {
        const product = await prisma.product.findUnique({
          where: { id: String(body.productId) },
          select: { name: true, costPrice: true, price: true },
        });

        if (!product) {
          return NextResponse.json(
            { error: "Product not found." },
            { status: 404 }
          );
        }

        productName = product.name;
        actualPrice = validAmount(
          body.actualPrice ?? product.costPrice
        );
        websitePrice = validAmount(
          body.websitePrice ?? product.price
        );
      }

      const personalExpense = validAmount(
        body.personalExpense ?? existing.personalExpense
      );

      const businessExpense = validAmount(
        body.businessExpense ?? existing.businessExpense
      );

      const fuelCharges = validAmount(
        body.fuelCharges ?? existing.fuelCharges
      );

      const deliveryCharges = validAmount(
        body.deliveryCharges ?? existing.deliveryCharges
      );

      const discountSalePrice = validAmount(
        body.discountSalePrice ?? existing.discountSalePrice
      );

      const discountQuantity = Number(
        body.discountQuantity ?? existing.discountQuantity
      );

      if (
        [
          actualPrice,
          websitePrice,
          personalExpense,
          businessExpense,
          fuelCharges,
          deliveryCharges,
          discountSalePrice,
        ].some((value) => value === null) ||
        !Number.isInteger(discountQuantity) ||
        discountQuantity < 0 ||
        Number.isNaN(date.getTime())
      ) {
        return NextResponse.json(
          { error: "Invalid row values." },
          { status: 400 }
        );
      }

      const row = await prisma.expenseSheetRow.update({
        where: { id },
        data: {
          date,
          productId,
          productName,
          actualPrice: actualPrice!,
          websitePrice: websitePrice!,
          personalExpense: personalExpense!,
          businessExpense: businessExpense!,
          fuelCharges: fuelCharges!,
          deliveryCharges: deliveryCharges!,
          discountSalePrice: discountSalePrice!,
          discountQuantity,
          note:
            body.note === undefined
              ? existing.note
              : body.note
                ? String(body.note).slice(0, 1000)
                : null,
          customValues:
            body.customValues === undefined
              ? undefined
              : body.customValues,
        },
      });

      return NextResponse.json({ row });
    }

    if (action === "payment") {
      const id = String(body.id || "");
      const amount = validAmount(body.amount);

      if (!id || amount === null || amount <= 0) {
        return NextResponse.json(
          { error: "Invalid payment." },
          { status: 400 }
        );
      }

      const payment = await prisma.expenseSheetPayment.update({
        where: { id },
        data: {
          amount,
          note: body.note ? String(body.note).slice(0, 500) : null,
        },
      });

      return NextResponse.json({ payment });
    }

    return NextResponse.json(
      { error: "Unknown action." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Expense sheet PATCH error:", error);

    return NextResponse.json(
      { error: "Failed to update expense sheet data." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  if (!verifyAdminRequest(request)) return unauthorized();

  try {
    const body = await request.json();
    const id = String(body.id || "");
    const action = String(body.action || "");

    if (!id) {
      return NextResponse.json(
        { error: "ID is required." },
        { status: 400 }
      );
    }

    if (action === "row") {
      await prisma.expenseSheetRow.delete({ where: { id } });
    } else if (action === "payment") {
      await prisma.expenseSheetPayment.delete({ where: { id } });
    } else if (action === "column") {
      await prisma.expenseSheetColumn.delete({ where: { id } });
    } else {
      return NextResponse.json(
        { error: "Unknown action." },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Expense sheet DELETE error:", error);

    return NextResponse.json(
      { error: "Failed to delete record." },
      { status: 500 }
    );
  }
}
