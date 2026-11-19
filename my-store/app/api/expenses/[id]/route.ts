
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/admin-auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// PUT /api/expenses/[id] — Update expense
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

    const existing = await prisma.expenseRecord.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Expense not found" },
        { status: 404 }
      );
    }

    const { date, type, amount, note } = body;

    const validTypes = ["ADS", "PACKAGING", "OTHER"];

    let updatedDate: Date | undefined;
    let updatedType: string | undefined;
    let updatedAmount: number | undefined;
    let updatedNote: string | null | undefined;

    if (date !== undefined) {
      updatedDate = new Date(date);

      if (Number.isNaN(updatedDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid expense date" },
          { status: 400 }
        );
      }
    }

    if (type !== undefined) {
      if (typeof type !== "string" || !type.trim()) {
        return NextResponse.json(
          { error: "Expense type is required" },
          { status: 400 }
        );
      }

      updatedType = type.trim().toUpperCase();

      if (!validTypes.includes(updatedType)) {
        return NextResponse.json(
          { error: "Invalid expense type" },
          { status: 400 }
        );
      }
    }

    if (amount !== undefined) {
      updatedAmount = Number(amount);

      if (
        !Number.isFinite(updatedAmount) ||
        updatedAmount <= 0
      ) {
        return NextResponse.json(
          { error: "Amount must be a positive number" },
          { status: 400 }
        );
      }
    }

    if (note !== undefined) {
      if (note !== null && typeof note !== "string") {
        return NextResponse.json(
          { error: "Note must be text" },
          { status: 400 }
        );
      }

      updatedNote =
        typeof note === "string" && note.trim()
          ? note.trim()
          : null;
    }

    const expense = await prisma.expenseRecord.update({
      where: { id },
      data: {
        date: updatedDate,
        type: updatedType,
        amount: updatedAmount,
        note: updatedNote,
      },
    });

    return NextResponse.json({
      success: true,
      expense,
    });
  } catch (error) {
    console.error("PUT /api/expenses/[id] error:", error);

    return NextResponse.json(
      { error: "Failed to update expense" },
      { status: 500 }
    );
  }
}

// DELETE /api/expenses/[id] — Delete expense
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

    const existing = await prisma.expenseRecord.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Expense not found" },
        { status: 404 }
      );
    }

    await prisma.expenseRecord.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Expense deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/expenses/[id] error:", error);

    return NextResponse.json(
      { error: "Failed to delete expense" },
      { status: 500 }
    );
  }
}
