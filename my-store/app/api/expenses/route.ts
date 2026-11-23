
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_TYPES = ["ADS", "PACKAGING", "OTHER"] as const;

function getPakistanDateRange(dateString: string, endOfDay = false) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return null;
  }

  const date = new Date(
    `${dateString}T${endOfDay ? "23:59:59.999" : "00:00:00"}+05:00`
  );

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// GET /api/expenses
// Admin expense history
export async function GET(request: Request) {
  try {
    const auth = await verifyAdminRequest(request);

    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { searchParams } = new URL(request.url);

    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: {
      date?: {
        gte?: Date;
        lte?: Date;
      };
    } = {};

    if (from) {
      const fromDate = getPakistanDateRange(from);

      if (!fromDate) {
        return errorResponse("Invalid start date", 400);
      }

      where.date = {
        ...where.date,
        gte: fromDate,
      };
    }

    if (to) {
      const toDate = getPakistanDateRange(to, true);

      if (!toDate) {
        return errorResponse("Invalid end date", 400);
      }

      where.date = {
        ...where.date,
        lte: toDate,
      };
    }

    if (from && to && from > to) {
      return errorResponse(
        "Start date cannot be after end date",
        400
      );
    }

    const expenses = await prisma.expenseRecord.findMany({
      where,
      orderBy: [
        { date: "desc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json(
      { success: true, expenses },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/expenses error:", error);

    return errorResponse("Failed to fetch expenses", 500);
  }
}

// POST /api/expenses
// Add new expense
export async function POST(request: Request) {
  try {
    const auth = await verifyAdminRequest(request);

    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON request body", 400);
    }

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return errorResponse("Invalid request body", 400);
    }

    const data = body as {
      date?: unknown;
      type?: unknown;
      amount?: unknown;
      note?: unknown;
    };

    const { date, type, amount, note } = data;

    if (typeof type !== "string" || !type.trim()) {
      return errorResponse("Expense type is required", 400);
    }

    const normalizedType = type.trim().toUpperCase();

    if (!VALID_TYPES.includes(normalizedType as typeof VALID_TYPES[number])) {
      return errorResponse("Invalid expense type", 400);
    }

    const expenseAmount = Number(amount);

    if (
      !Number.isFinite(expenseAmount) ||
      expenseAmount <= 0
    ) {
      return errorResponse(
        "Amount must be a positive number",
        400
      );
    }

    let expenseDate: Date;

    if (date === undefined || date === null || date === "") {
      expenseDate = new Date();
    } else if (typeof date === "string") {
      // Date-only values are interpreted in Pakistan time.
      const parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(date)
        ? getPakistanDateRange(date)
        : new Date(date);

      if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
        return errorResponse("Invalid expense date", 400);
      }

      expenseDate = parsedDate;
    } else {
      return errorResponse("Invalid expense date", 400);
    }

    if (
      note !== undefined &&
      note !== null &&
      typeof note !== "string"
    ) {
      return errorResponse("Note must be text", 400);
    }

    const cleanNote =
      typeof note === "string" && note.trim()
        ? note.trim().slice(0, 2000)
        : null;

    const expense = await prisma.expenseRecord.create({
      data: {
        date: expenseDate,
        type: normalizedType,
        amount: expenseAmount,
        note: cleanNote,
      },
    });

    return NextResponse.json(
      {
        success: true,
        expense,
      },
      {
        status: 201,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("POST /api/expenses error:", error);

    return errorResponse("Failed to create expense", 500);
  }
}
