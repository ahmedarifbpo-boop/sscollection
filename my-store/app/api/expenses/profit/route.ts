
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/admin-auth";

export const runtime = "nodejs";

function getPakistanDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function isValidDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(new Date(`${value}T00:00:00+05:00`).getTime());
}

function getNextDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + 1));

  return [
    next.getUTCFullYear(),
    String(next.getUTCMonth() + 1).padStart(2, "0"),
    String(next.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function getPreviousDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const previous = new Date(Date.UTC(year, month - 1, day - 1));

  return [
    previous.getUTCFullYear(),
    String(previous.getUTCMonth() + 1).padStart(2, "0"),
    String(previous.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function pakistanStartOfDay(value: string) {
  return new Date(`${value}T00:00:00+05:00`);
}

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

    const today = getPakistanDate(new Date());

    const from = searchParams.get("from") || getPreviousDate(today);
    const to = searchParams.get("to") || today;

    if (!isValidDate(from) || !isValidDate(to)) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD." },
        { status: 400 }
      );
    }

    if (from > to) {
      return NextResponse.json(
        { error: "Start date cannot be after end date." },
        { status: 400 }
      );
    }

    const startDate = pakistanStartOfDay(from);
    const endDate = pakistanStartOfDay(getNextDate(to));

    const [orders, expenses] = await Promise.all([
      prisma.order.findMany({
        where: {
          status: "DELIVERED",
          createdAt: {
            gte: startDate,
            lt: endDate,
          },
        },
        include: {
          items: {
            select: {
              id: true,
              name: true,
              price: true,
              quantity: true,
              actualCost: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),

      prisma.expenseRecord.findMany({
        where: {
          date: {
            gte: startDate,
            lt: endDate,
          },
        },
        orderBy: {
          date: "desc",
        },
      }),
    ]);

    type DailyRecord = {
      date: string;
      ordersCount: number;
      revenue: number;
      productCost: number;
      courierCost: number;
      orderProfit: number;
      expenses: number;
      netProfit: number;
      expenseBreakdown: {
        ADS: number;
        PACKAGING: number;
        OTHER: number;
      };
    };

    const dailyMap = new Map<string, DailyRecord>();

    const getDailyRecord = (date: string): DailyRecord => {
      let record = dailyMap.get(date);

      if (!record) {
        record = {
          date,
          ordersCount: 0,
          revenue: 0,
          productCost: 0,
          courierCost: 0,
          orderProfit: 0,
          expenses: 0,
          netProfit: 0,
          expenseBreakdown: {
            ADS: 0,
            PACKAGING: 0,
            OTHER: 0,
          },
        };

        dailyMap.set(date, record);
      }

      return record;
    };

    const orderDetails = orders.map((order) => {
      const date = getPakistanDate(order.createdAt);

      const revenue = Number(order.total || 0);

      const productCost = order.items.reduce(
        (sum, item) =>
          sum +
          Number(item.actualCost || 0) *
            Number(item.quantity || 0),
        0
      );

      const courierCost = Number(order.courierCost || 0);

      const profit = revenue - productCost - courierCost;

      const daily = getDailyRecord(date);

      daily.ordersCount += 1;
      daily.revenue += revenue;
      daily.productCost += productCost;
      daily.courierCost += courierCost;
      daily.orderProfit += profit;

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        date,
        customerName: order.customerName,
        revenue,
        productCost,
        courierCost,
        profit,
        items: order.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          sellingPrice: item.price,
          actualCost: item.actualCost,
          totalCost:
            Number(item.actualCost || 0) *
            Number(item.quantity || 0),
        })),
      };
    });

    const expenseDetails = expenses.map((expense) => {
      const date = getPakistanDate(expense.date);
      const amount = Number(expense.amount || 0);

      const daily = getDailyRecord(date);

      daily.expenses += amount;

      if (
        expense.type === "ADS" ||
        expense.type === "PACKAGING" ||
        expense.type === "OTHER"
      ) {
        daily.expenseBreakdown[expense.type] += amount;
      }

      return {
        id: expense.id,
        date,
        type: expense.type,
        amount,
        note: expense.note,
      };
    });

    // Include dates with no orders or expenses as zero-value days.
    let currentDate = from;

    while (currentDate <= to) {
      getDailyRecord(currentDate);
      currentDate = getNextDate(currentDate);
    }

    const dailyRecords = Array.from(dailyMap.values())
      .map((day) => ({
        ...day,
        netProfit: day.orderProfit - day.expenses,
      }))
      .sort((a, b) => b.date.localeCompare(a.date));

    const summary = dailyRecords.reduce(
      (total, day) => ({
        ordersCount: total.ordersCount + day.ordersCount,
        revenue: total.revenue + day.revenue,
        productCost: total.productCost + day.productCost,
        courierCost: total.courierCost + day.courierCost,
        orderProfit: total.orderProfit + day.orderProfit,
        expenses: total.expenses + day.expenses,
        netProfit: total.netProfit + day.netProfit,
      }),
      {
        ordersCount: 0,
        revenue: 0,
        productCost: 0,
        courierCost: 0,
        orderProfit: 0,
        expenses: 0,
        netProfit: 0,
      }
    );

    return NextResponse.json({
      success: true,
      period: {
        from,
        to,
        timezone: "Asia/Karachi",
      },
      summary,
      daily: dailyRecords,
      orders: orderDetails,
      expenses: expenseDetails,
    });
  } catch (error) {
    console.error("PROFIT_REPORT_ERROR:", error);

    return NextResponse.json(
      { error: "Failed to calculate profit report." },
      { status: 500 }
    );
  }
}
