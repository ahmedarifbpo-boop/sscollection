
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/admin-auth";

// GET /api/expenses — Admin expense history
export async function GET(request: Request) {
  try {
    const auth = await verifyAdminRequest(request);

    if (!auth) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
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
      const fromDate = new Date(from);

      if (Number.isNaN(fromDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid start date" },
          { status: 400 }
        );
      }

      where.date = {
        ...where.date,
        gte: fromDate,
      };
    }

    if (to) {
      const toDate = new Date(to);

      if (Number.isNaN(toDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid end date" },
          { status: 400 }
        );
      }

      where.date = {
        ...where.date,
        lte: toDate,
      };
    }

    const expenses = await prisma.expenseRecord.findMany({
      where,
      orderBy: [
        { date: "desc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json(
      { expenses },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/expenses error:", error);

    return NextResponse.json(
      { error: "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}

// POST /api/expenses — Add new expense
export async function POST(request: Request) {
  try {
    const auth = await verifyAdminRequest(request);

    if (!auth) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { date, type, amount, note } = body;

    if (typeof type !== "string" || !type.trim()) {
      return NextResponse.json(
        { error: "Expense type is required" },
        { status: 400 }
      );
    }

    const validTypes = ["ADS", "PACKAGING", "OTHER"];

    if (!validTypes.includes(type.trim().toUpperCase())) {
      return NextResponse.json(
        { error: "Invalid expense type" },
        { status: 400 }
      );
    }

    const expenseAmount = Number(amount);

    if (
      !Number.isFinite(expenseAmount) ||
      expenseAmount <= 0
    ) {
      return NextResponse.json(
        { error: "Amount must be a positive number" },
        { status: 400 }
      );
    }

    const expenseDate =
      date !== undefined ? new Date(date) : new Date();

    if (Number.isNaN(expenseDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid expense date" },
        { status: 400 }
      );
    }

    if (
      note !== undefined &&
      note !== null &&
      typeof note !== "string"
    ) {
      return NextResponse.json(
        { error: "Note must be text" },
        { status: 400 }
      );
    }

    const expense = await prisma.expenseRecord.create({
      data: {
        date: expenseDate,
        type: type.trim().toUpperCase(),
        amount: expenseAmount,
        note:
          typeof note === "string" && note.trim()
            ? note.trim()
            : null,
      },
    });

    return NextResponse.json(
      { success: true, expense },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/expenses error:", error);

    return NextResponse.json(
      { error: "Failed to create expense" },
      { status: 500 }
    );
  }
}
