
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import jsPDF from "jspdf";
import {
  ShoppingBag,
  Eye,
  Clock,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  Coins,
  Printer,
  CheckSquare,
  Square,
  Loader2,
  ArrowRight,
  Download,
} from "lucide-react";

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface Customer {
  referralCode?: string;
  referredBy: string | null;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerAlternativePhone?: string | null;
  customerAddress: string;
  customerEmail: string | null;
  notes: string | null;
  allowOpenParcel?: boolean;
  subtotal: number;
  shipping: number;
  total: number;
  coinsUsed: number;
  coinsEarned: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  items: OrderItem[];
  customer: Customer | null;
}

const statusConfig: Record<
  string,
  { label: string; color: string; icon: any }
> = {
  PENDING: { label: "Pending", color: "#F59E0B", icon: Clock },
  CONFIRMED: { label: "Confirmed", color: "#0EA5E9", icon: CheckCircle2 },
  PROCESSING: { label: "Processing", color: "#3B82F6", icon: Package },
  SHIPPED: { label: "Shipped", color: "#8B5CF6", icon: Truck },
  DELIVERED: { label: "Delivered", color: "#10B981", icon: CheckCircle2 },
  CANCELLED: { label: "Cancelled", color: "#EF4444", icon: XCircle },
};

const filters = [
  "ALL",
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

const nextStatus: Record<string, string> = {
  PENDING: "PROCESSING",
  PROCESSING: "SHIPPED",
  SHIPPED: "DELIVERED",
};

const actionLabels: Record<string, string> = {
  PENDING: "Process Selected",
  PROCESSING: "Ship Selected",
  SHIPPED: "Deliver Selected",
};

const money = (amount: number) =>
  `Rs. ${Number(amount || 0).toLocaleString("en-PK")}`;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const safeText = (value: unknown) =>
  String(value ?? "").trim() || "-";

const escapeHtml = (value: unknown) =>
  String(value ?? "").replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[char];
  });

export default function AdminOrdersPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [error, setError] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // Directly fetch orders. The API itself verifies admin authentication.
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function loadOrders() {
      try {
        const res = await fetch("/api/orders", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });

        if (res.status === 401) {
          router.replace("/admin/login");
          return;
        }

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to fetch orders.");
        }

        if (!cancelled) {
          setOrders(Array.isArray(data.orders) ? data.orders : []);
          setError("");
        }
      } catch (err) {
        if (cancelled || (err instanceof Error && err.name === "AbortError")) {
          return;
        }

        console.error("Failed to fetch orders:", err);

        setError(
          err instanceof Error ? err.message : "Failed to fetch orders."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadOrders();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [router]);

  const filtered = useMemo(
    () =>
      filter === "ALL"
        ? orders
        : orders.filter((order) => order.status === filter),
    [orders, filter]
  );

  const canBulkUpdate = Boolean(nextStatus[filter]);

  // Selection and export are available in every tab.
  const selectableOrders = filtered;

  const selectedOrders = useMemo(
    () => selectableOrders.filter((order) => selectedIds.includes(order.id)),
    [selectableOrders, selectedIds]
  );

  const selectedTotal = useMemo(
    () => selectedOrders.reduce((sum, order) => sum + order.total, 0),
    [selectedOrders]
  );

  const allSelected =
    selectableOrders.length > 0 &&
    selectableOrders.every((order) => selectedIds.includes(order.id));

  const toggleOrder = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(selectableOrders.map((order) => order.id));
    }
  };

  const changeFilter = (newFilter: string) => {
    setFilter(newFilter);
    setSelectedIds([]);
  };

  // Sequential API updates preserve the existing reward/referral logic.
  const handleBulkUpdate = async () => {
    const targetStatus = nextStatus[filter];

    if (!targetStatus || selectedOrders.length === 0 || bulkLoading) return;

    const targetLabel = statusConfig[targetStatus]?.label || targetStatus;

    const confirmed = window.confirm(
      `Are you sure you want to move ${selectedOrders.length} selected order(s) to ${targetLabel}?`
    );

    if (!confirmed) return;

    setBulkLoading(true);
    setError("");

    const successfulIds: string[] = [];
    const failedIds: string[] = [];
    const failedOrders: string[] = [];
    const updatedOrders = new Map<string, Partial<Order>>();

    try {
      for (const order of selectedOrders) {
        try {
          const res = await fetch(`/api/orders/${order.id}`, {
            method: "PUT",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ status: targetStatus }),
          });

          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.error || "Update failed");
          }

          successfulIds.push(order.id);

          updatedOrders.set(order.id, {
            ...data.order,
            status: targetStatus,
          });
        } catch (err) {
          console.error(
            `Failed to update order ${order.orderNumber}:`,
            err
          );

          failedIds.push(order.id);
          failedOrders.push(order.orderNumber);
        }
      }

      // One state update instead of re-rendering after every order.
      if (updatedOrders.size > 0) {
        setOrders((prev) =>
          prev.map((order) => {
            const updated = updatedOrders.get(order.id);

            return updated
              ? {
                  ...order,
                  ...updated,
                  coinsEarned:
                    updated.coinsEarned ?? order.coinsEarned,
                }
              : order;
          })
        );
      }

      // Keep only failed orders selected.
      setSelectedIds(failedIds);

      if (failedOrders.length > 0) {
        setError(
          `${successfulIds.length} order(s) updated successfully. Failed: ${failedOrders.join(", ")}. Failed orders remain selected.`
        );
      } else {
        alert(
          `${successfulIds.length} order(s) successfully moved to ${targetLabel}.`
        );
      }
    } finally {
      setBulkLoading(false);
    }
  };

  // Generate a professional HTML document for printing.
  const createPrintDocument = useCallback((selected: Order[]) => {
    const pages = selected
      .map((order) => {
        const itemsHtml = order.items
          .map(
            (item) => `
              <tr>
                <td>${escapeHtml(item.name)}</td>
                <td>${Number(item.quantity) || 0}</td>
                <td>${money(item.price)}</td>
                <td>${money(item.price * item.quantity)}</td>
              </tr>
            `
          )
          .join("");

        const status = statusConfig[order.status]?.label || order.status;

        return `
          <section class="print-page">
            <header class="header">
              <div>
                <div class="brand">S.S COLLECTION</div>
                <div class="subtitle">ORDER DOCUMENT</div>
              </div>
              <div class="status">${escapeHtml(status)}</div>
            </header>

            <div class="order-number">
              <span>ORDER NUMBER</span>
              <strong>${escapeHtml(order.orderNumber)}</strong>
            </div>

            <div class="date">
              Order Date: ${escapeHtml(formatDate(order.createdAt))}
            </div>

            <div class="section">
              <div class="section-title">CUSTOMER DETAILS</div>
              <div class="customer-name">${escapeHtml(order.customerName)}</div>
              <div class="detail">
                <b>Phone:</b> ${escapeHtml(order.customerPhone)}
              </div>
              ${
                order.customerAlternativePhone
                  ? `<div class="detail"><b>Alternative:</b> ${escapeHtml(order.customerAlternativePhone)}</div>`
                  : ""
              }
              ${
                order.customerEmail
                  ? `<div class="detail"><b>Email:</b> ${escapeHtml(order.customerEmail)}</div>`
                  : ""
              }
              <div class="detail address">
                <b>Address:</b> ${escapeHtml(order.customerAddress)}
              </div>
            </div>

            <div class="section">
              <div class="section-title">ORDER ITEMS</div>
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>${itemsHtml}</tbody>
              </table>
            </div>

            <div class="totals">
              <div><span>Subtotal</span><b>${money(order.subtotal)}</b></div>
              <div><span>Shipping</span><b>${money(order.shipping)}</b></div>
              ${
                order.coinsUsed > 0
                  ? `<div><span>Coins Used</span><b>${money(order.coinsUsed)}</b></div>`
                  : ""
              }
              <div class="grand-total">
                <span>GRAND TOTAL</span><strong>${money(order.total)}</strong>
              </div>
            </div>

            <div class="bottom-details">
              <div><b>Payment:</b> ${escapeHtml(order.paymentMethod)}</div>
              <div class="parcel">
                <b>Customer Allowed to Open Parcel:</b>
                <strong>${order.allowOpenParcel ? "YES" : "NO"}</strong>
              </div>
              <div class="remarks">
                <b>Remarks:</b><br>
                ${escapeHtml(order.notes || "No remarks")}
              </div>
            </div>

            <footer>
              Thank you for shopping with S.S Collection
            </footer>
          </section>
        `;
      })
      .join("");

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>S.S Collection Orders</title>
        <style>
          * { box-sizing: border-box; }
          @page { size: 100mm 150mm; margin: 0; }

          html, body {
            margin: 0;
            padding: 0;
            font-family: Arial, Helvetica, sans-serif;
            color: #172033;
          }

          .print-page {
            width: 100mm;
            height: 150mm;
            padding: 5mm;
            overflow: hidden;
            position: relative;
            page-break-after: always;
            break-after: page;
            background: #fff;
            font-size: 8px;
          }

          .print-page:last-child {
            page-break-after: auto;
            break-after: auto;
          }

          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 2px solid #172033;
            padding-bottom: 7px;
          }

          .brand {
            font-size: 17px;
            font-weight: 900;
            letter-spacing: 1px;
          }

          .subtitle {
            font-size: 7px;
            letter-spacing: 2px;
            margin-top: 3px;
            color: #64748b;
          }

          .status {
            border: 1px solid #172033;
            border-radius: 3px;
            padding: 5px 7px;
            font-size: 8px;
            font-weight: bold;
          }

          .order-number {
            display: flex;
            flex-direction: column;
            gap: 3px;
            margin-top: 9px;
          }

          .order-number span,
          .section-title {
            font-size: 7px;
            font-weight: 800;
            letter-spacing: 1px;
            color: #64748b;
          }

          .order-number strong {
            font-size: 15px;
            overflow-wrap: anywhere;
          }

          .date {
            font-size: 8px;
            color: #64748b;
            margin-top: 4px;
          }

          .section {
            margin-top: 10px;
          }

          .section-title {
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 4px;
            margin-bottom: 5px;
          }

          .customer-name {
            font-size: 11px;
            font-weight: 800;
            margin-bottom: 3px;
          }

          .detail {
            font-size: 8px;
            line-height: 1.45;
            overflow-wrap: anywhere;
            margin-bottom: 2px;
          }

          .address {
            margin-top: 3px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            font-size: 7px;
          }

          th, td {
            padding: 4px 2px;
            border-bottom: 1px solid #e2e8f0;
            text-align: left;
            overflow-wrap: anywhere;
          }

          th {
            background: #f1f5f9;
            font-weight: 800;
          }

          th:first-child, td:first-child { width: 43%; }
          th:nth-child(2), td:nth-child(2) {
            width: 10%;
            text-align: center;
          }
          th:nth-child(3), td:nth-child(3) { width: 21%; }
          th:last-child, td:last-child {
            width: 26%;
            text-align: right;
          }

          .totals {
            margin-top: 8px;
            margin-left: auto;
            width: 65%;
          }

          .totals > div {
            display: flex;
            justify-content: space-between;
            padding: 2px 0;
            font-size: 8px;
          }

          .grand-total {
            border-top: 1.5px solid #172033;
            margin-top: 4px;
            padding-top: 5px !important;
            font-size: 10px !important;
            font-weight: 900;
          }

          .bottom-details {
            border-top: 1px solid #cbd5e1;
            margin-top: 8px;
            padding-top: 6px;
            font-size: 8px;
            line-height: 1.5;
          }

          .parcel {
            margin-top: 4px;
            border: 1px solid #cbd5e1;
            padding: 4px;
          }

          .parcel strong {
            float: right;
            font-size: 9px;
          }

          .remarks {
            margin-top: 5px;
            overflow-wrap: anywhere;
          }

          footer {
            position: absolute;
            bottom: 4mm;
            left: 5mm;
            right: 5mm;
            text-align: center;
            border-top: 1px solid #cbd5e1;
            padding-top: 5px;
            font-size: 7px;
            color: #64748b;
          }

          @media screen {
            body { background: #e5e7eb; }
            .print-page {
              margin: 15px auto;
              box-shadow: 0 2px 12px #0002;
            }
          }

          @media print {
            body { background: #fff; }
          }
        </style>
      </head>
      <body>
        ${pages}
        <script>
          window.onload = function () {
            window.focus();
            window.print();
          };
        </script>
      </body>
      </html>
    `;
  }, []);

  // Print selected orders, one 100mm x 150mm page per order.
  const handlePrintSelected = () => {
    if (selectedOrders.length === 0 || exportLoading) return;

    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      alert("Please allow pop-ups to print orders.");
      return;
    }

    printWindow.document.open();
    printWindow.document.write(createPrintDocument(selectedOrders));
    printWindow.document.close();
  };

  // Generate a downloadable PDF directly using jsPDF.
  const handleSavePDF = async () => {
    if (selectedOrders.length === 0 || exportLoading) return;

    setExportLoading(true);
    setError("");

    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [100, 150],
        compress: true,
      });

      const pageWidth = 100;
      const pageHeight = 150;
      const margin = 6;
      const contentWidth = pageWidth - margin * 2;

      selectedOrders.forEach((order, index) => {
        if (index > 0) {
          pdf.addPage([100, 150], "portrait");
        }

        let y = 8;

        const line = (position: number) => {
          pdf.setDrawColor(210, 216, 225);
          pdf.line(margin, position, pageWidth - margin, position);
        };

        const write = (
          value: string,
          x: number,
          position: number,
          size = 7,
          style: "normal" | "bold" = "normal",
          maxWidth = contentWidth
        ) => {
          pdf.setFont("helvetica", style);
          pdf.setFontSize(size);

          const lines = pdf.splitTextToSize(value, maxWidth);
          pdf.text(lines, x, position);

          return lines.length * (size * 0.42 + 1);
        };

        const section = (title: string) => {
          y += 3;
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(7);
          pdf.setTextColor(80, 95, 115);
          pdf.text(title.toUpperCase(), margin, y);
          y += 2;
          line(y);
          y += 4;
          pdf.setTextColor(25, 35, 50);
        };

        // Header
        pdf.setTextColor(20, 32, 50);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(15);
        pdf.text("S.S COLLECTION", margin, y + 3);

        pdf.setFontSize(6);
        pdf.setTextColor(100, 116, 139);
        pdf.text("ORDER DOCUMENT", margin, y + 7);

        pdf.setDrawColor(30, 41, 59);
        pdf.setLineWidth(0.6);
        pdf.line(margin, y + 10, pageWidth - margin, y + 10);
        y += 15;

        // Order information
        pdf.setTextColor(80, 95, 115);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(6);
        pdf.text("ORDER NUMBER", margin, y);

        y += 5;
        pdf.setTextColor(20, 32, 50);
        y += write(order.orderNumber, margin, y, 11, "bold");

        y += 2;
        y += write(
          `Date: ${formatDate(order.createdAt)}`,
          margin,
          y,
          6
        );

        const status = statusConfig[order.status]?.label || order.status;
        y += write(`Status: ${status}`, margin, y, 6, "bold");

        section("Customer Details");

        y += write(order.customerName, margin, y, 8, "bold");
        y += write(`Phone: ${safeText(order.customerPhone)}`, margin, y, 6);

        if (order.customerAlternativePhone) {
          y += write(
            `Alternative: ${order.customerAlternativePhone}`,
            margin,
            y,
            6
          );
        }

        if (order.customerEmail) {
          y += write(`Email: ${order.customerEmail}`, margin, y, 6);
        }

        y += write(
          `Address: ${safeText(order.customerAddress)}`,
          margin,
          y,
          6
        );

        section("Order Items");

        // Table header
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(5.5);
        pdf.setFillColor(241, 245, 249);
        pdf.rect(margin, y - 3, contentWidth, 5, "F");

        pdf.text("PRODUCT", margin + 1, y);
        pdf.text("QTY", 56, y);
        pdf.text("PRICE", 65, y);
        pdf.text("AMOUNT", 93, y, { align: "right" });

        y += 5;

        // Dynamically reduce item font size for long orders.
        const availableItemHeight = Math.max(
          12,
          150 - y - 54
        );

        const itemFontSize = Math.max(
          3.5,
          Math.min(6, availableItemHeight / Math.max(order.items.length, 1) * 1.5)
        );

        for (const item of order.items) {
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(itemFontSize);

          const productLines = pdf.splitTextToSize(
            item.name,
            35
          );

          const rowHeight = Math.max(
            4,
            productLines.length * (itemFontSize * 0.42 + 0.7)
          );

          pdf.text(productLines, margin + 1, y);
          pdf.text(String(item.quantity), 56, y);
          pdf.text(
            Number(item.price).toLocaleString("en-PK"),
            65,
            y
          );
          pdf.text(
            Number(item.price * item.quantity).toLocaleString("en-PK"),
            93,
            y,
            { align: "right" }
          );

          y += rowHeight;
          line(y);
          y += 2;
        }

        // Totals
        section("Payment Summary");

        const addTotal = (label: string, amount: number, bold = false) => {
          pdf.setFont("helvetica", bold ? "bold" : "normal");
          pdf.setFontSize(bold ? 8 : 6);
          pdf.text(label, margin, y);
          pdf.text(money(amount), pageWidth - margin, y, {
            align: "right",
          });
          y += bold ? 5 : 4;
        };

        addTotal("Subtotal", order.subtotal);
        addTotal("Shipping", order.shipping);

        if (order.coinsUsed > 0) {
          addTotal("Coins Used", order.coinsUsed);
        }

        line(y);
        y += 4;
        addTotal("GRAND TOTAL", order.total, true);

        // Delivery instructions and remarks
        section("Delivery Instructions");

        y += write(
          `Payment Method: ${safeText(order.paymentMethod)}`,
          margin,
          y,
          6
        );

        y += write(
          `Open Parcel Allowed: ${order.allowOpenParcel ? "YES" : "NO"}`,
          margin,
          y,
          6,
          "bold"
        );

        y += 2;
        y += write("Remarks:", margin, y, 6, "bold");

        y += write(
          safeText(order.notes || "No remarks"),
          margin,
          y,
          5.5
        );

        // Footer
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(5);
        pdf.setTextColor(100, 116, 139);
        pdf.text(
          "Thank you for shopping with S.S Collection",
          pageWidth / 2,
          pageHeight - 4,
          { align: "center" }
        );
      });

      const filename =
        selectedOrders.length === 1
          ? `${selectedOrders[0].orderNumber}.pdf`
          : `SS-Collection-Orders-${Date.now()}.pdf`;

      pdf.save(filename);
    } catch (err) {
      console.error("PDF generation failed:", err);
      setError("PDF could not be generated. Please try again.");
    } finally {
      setExportLoading(false);
    }
  };

  // Existing individual shipping label.
  const printOrderLabel = (order: Order) => {
    const printWindow = window.open("", "_blank", "width=800,height=900");

    if (!printWindow) {
      alert("Please allow pop-ups to print the shipping label.");
      return;
    }

    const itemsHtml = order.items
      .map(
        (item) => `
          <tr>
            <td>${escapeHtml(item.name)}</td>
            <td>${Number(item.quantity) || 0}</td>
            <td>${money(item.price * item.quantity)}</td>
          </tr>
        `
      )
      .join("");

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Shipping Label - ${escapeHtml(order.orderNumber)}</title>
        <style>
          * { box-sizing: border-box; }
          @page { size: 100mm 150mm; margin: 0; }
          body {
            margin: 0;
            padding: 8mm;
            font-family: Arial, Helvetica, sans-serif;
            color: #111;
          }
          .label { border: 2px solid #111; padding: 5mm; }
          .brand {
            text-align: center;
            font-size: 23px;
            font-weight: 800;
            letter-spacing: 1px;
          }
          .subtitle {
            text-align: center;
            font-size: 10px;
            letter-spacing: 2px;
            margin-bottom: 12px;
          }
          .divider { border-top: 2px solid #111; margin: 10px 0; }
          .heading {
            font-size: 10px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .order-number {
            font-size: 19px;
            font-weight: 800;
            text-align: center;
            margin: 10px 0;
            overflow-wrap: anywhere;
          }
          .detail { font-size: 12px; line-height: 1.6; overflow-wrap: anywhere; }
          .customer-name { font-size: 17px; font-weight: bold; margin-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; font-size: 10px; table-layout: fixed; }
          th, td { padding: 6px 3px; text-align: left; border-bottom: 1px solid #bbb; overflow-wrap: anywhere; }
          th { border-bottom: 2px solid #111; }
          th:first-child, td:first-child { width: 52%; }
          th:nth-child(2), td:nth-child(2) { width: 13%; text-align: center; }
          th:last-child, td:last-child { width: 35%; text-align: right; }
          .total { display: flex; justify-content: space-between; font-size: 17px; font-weight: 800; margin-top: 12px; }
          .cod { text-align: center; font-size: 15px; font-weight: 800; border: 2px solid #111; padding: 9px; margin-top: 12px; }
          .footer { text-align: center; font-size: 9px; margin-top: 15px; }
          @media screen {
            body { background: #eee; display: flex; justify-content: center; padding: 20px; }
            .label { background: white; max-width: 380px; }
          }
        </style>
      </head>
      <body>
        <div class="label">
          <div class="brand">S.S COLLECTION</div>
          <div class="subtitle">SHIPPING LABEL</div>
          <div class="divider"></div>
          <div class="heading">Order Number</div>
          <div class="order-number">${escapeHtml(order.orderNumber)}</div>
          <div class="divider"></div>
          <div class="heading">Deliver To</div>
          <div class="customer-name">${escapeHtml(order.customerName)}</div>
          <div class="detail"><strong>Phone:</strong> ${escapeHtml(order.customerPhone)}</div>
          <div class="detail"><strong>Address:</strong><br>${escapeHtml(order.customerAddress)}</div>
          <div class="divider"></div>
          <div class="heading">Order Items</div>
          <table>
            <thead><tr><th>Product</th><th>Qty</th><th>Amount</th></tr></thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <div class="total"><span>Total</span><span>${money(order.total)}</span></div>
          <div class="cod">CASH ON DELIVERY<br>${money(order.total)}</div>
          <div class="divider"></div>
          <div class="detail"><strong>Order Date:</strong> ${escapeHtml(formatDate(order.createdAt))}</div>
          <div class="detail"><strong>Open Parcel:</strong> ${order.allowOpenParcel ? "YES" : "NO"}</div>
          <div class="footer">Thank you for shopping with S.S Collection</div>
        </div>
        <script>
          window.onload = function () {
            window.focus();
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const totalOrders = orders.length;
  const pendingCount = orders.filter((o) => o.status === "PENDING").length;
  const processingCount = orders.filter((o) => o.status === "PROCESSING").length;
  const shippedCount = orders.filter((o) => o.status === "SHIPPED").length;
  const deliveredCount = orders.filter((o) => o.status === "DELIVERED").length;

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "22px",
              fontWeight: "600",
              color: "var(--text-primary)",
              marginBottom: "4px",
            }}
          >
            Orders
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            Manage and track all customer orders
          </p>
        </div>

        <div
          style={{
            fontSize: "12px",
            color: "var(--text-secondary)",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            padding: "9px 13px",
            borderRadius: "4px",
          }}
        >
          {totalOrders} Total Orders
        </div>
      </div>

      {/* Summary */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "10px",
          marginBottom: "20px",
        }}
      >
        {[
          { label: "Pending", count: pendingCount, color: "#F59E0B" },
          { label: "Processing", count: processingCount, color: "#3B82F6" },
          { label: "Shipped", count: shippedCount, color: "#8B5CF6" },
          { label: "Delivered", count: deliveredCount, color: "#10B981" },
        ].map((item) => (
          <div key={item.label} className="dz-card" style={{ padding: "14px" }}>
            <div
              style={{
                fontSize: "12px",
                color: "var(--text-muted)",
                marginBottom: "7px",
              }}
            >
              {item.label}
            </div>
            <div
              style={{
                fontSize: "24px",
                fontWeight: "700",
                color: item.color,
              }}
            >
              {item.count}
            </div>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            padding: "12px 16px",
            marginBottom: "16px",
            borderRadius: "6px",
            background: "#FEF2F2",
            color: "#B91C1C",
            fontSize: "13px",
          }}
        >
          {error}
          <button
            type="button"
            onClick={() => setError("")}
            style={{
              float: "right",
              border: 0,
              background: "transparent",
              color: "inherit",
              cursor: "pointer",
              fontWeight: "700",
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "16px",
          flexWrap: "wrap",
        }}
      >
        {filters.map((s) => {
          const isActive = filter === s;
          const count =
            s === "ALL"
              ? orders.length
              : orders.filter((o) => o.status === s).length;

          return (
            <button
              key={s}
              type="button"
              onClick={() => changeFilter(s)}
              style={{
                padding: "9px 14px",
                borderRadius: "4px",
                fontSize: "12px",
                fontWeight: "600",
                border: isActive
                  ? "1px solid var(--accent)"
                  : "1px solid var(--border)",
                background: isActive ? "var(--accent)" : "var(--surface)",
                color: isActive ? "#fff" : "var(--text-secondary)",
                cursor: "pointer",
              }}
            >
              {s === "ALL" ? "All" : statusConfig[s]?.label || s} ({count})
            </button>
          );
        })}
      </div>

      {/* Bulk Actions */}
      {!loading && selectableOrders.length > 0 && (
        <div
          className="dz-card"
          style={{
            padding: "14px 16px",
            marginBottom: "16px",
            border: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div>
              <button
                type="button"
                onClick={toggleSelectAll}
                disabled={bulkLoading || exportLoading}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  border: 0,
                  background: "transparent",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  padding: 0,
                  fontSize: "13px",
                  fontWeight: "600",
                }}
              >
                {allSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                {allSelected ? "Deselect All" : "Select All Orders"}
              </button>

              <div
                style={{
                  fontSize: "12px",
                  color: "var(--text-muted)",
                  marginTop: "6px",
                }}
              >
                {selectedOrders.length} of {selectableOrders.length} selected
                {selectedOrders.length > 0 &&
                  ` · Total: ${money(selectedTotal)}`}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                onClick={handlePrintSelected}
                disabled={selectedOrders.length === 0 || exportLoading || bulkLoading}
                className="dz-btn-secondary"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "7px",
                  fontSize: "12px",
                  padding: "10px 13px",
                  cursor: "pointer",
                  opacity: selectedOrders.length === 0 ? 0.5 : 1,
                }}
              >
                <Printer size={15} />
                Print Selected
              </button>

              <button
                type="button"
                onClick={handleSavePDF}
                disabled={selectedOrders.length === 0 || exportLoading || bulkLoading}
                className="dz-btn-secondary"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "7px",
                  fontSize: "12px",
                  padding: "10px 13px",
                  cursor: "pointer",
                  opacity: selectedOrders.length === 0 ? 0.5 : 1,
                }}
              >
                {exportLoading ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Download size={15} />
                )}
                {exportLoading ? "Generating PDF..." : "Save PDF"}
              </button>

              {canBulkUpdate && (
                <button
                  type="button"
                  onClick={handleBulkUpdate}
                  disabled={
                    selectedOrders.length === 0 ||
                    bulkLoading ||
                    exportLoading
                  }
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    padding: "10px 16px",
                    border: 0,
                    borderRadius: "4px",
                    background:
                      selectedOrders.length === 0 || bulkLoading
                        ? "#9CA3AF"
                        : "var(--accent)",
                    color: "#fff",
                    fontSize: "12px",
                    fontWeight: "700",
                    cursor: "pointer",
                    opacity: selectedOrders.length === 0 ? 0.7 : 1,
                  }}
                >
                  {bulkLoading ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Updating Orders...
                    </>
                  ) : (
                    <>
                      {actionLabels[filter]}
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Orders */}
      {loading ? (
        <div
          className="dz-card"
          style={{
            padding: "60px 24px",
            textAlign: "center",
            color: "var(--text-muted)",
          }}
        >
          <Loader2
            size={26}
            className="animate-spin"
            style={{ margin: "0 auto 12px" }}
          />
          Loading orders...
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="dz-card"
          style={{
            padding: "60px 24px",
            textAlign: "center",
          }}
        >
          <ShoppingBag
            size={48}
            style={{
              color: "var(--border-strong)",
              marginBottom: "12px",
            }}
          />
          <h2
            style={{
              fontSize: "16px",
              fontWeight: "500",
              color: "var(--text-primary)",
              marginBottom: "6px",
            }}
          >
            {filter === "ALL" ? "No orders yet" : `No ${filter.toLowerCase()} orders`}
          </h2>
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            {filter === "ALL"
              ? "When customers place orders, they will appear here."
              : "There are no orders in this section."}
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {filtered.map((order) => {
            const cfg = statusConfig[order.status] || statusConfig.PENDING;
            const StatusIcon = cfg.icon;

            const hasCoins =
              order.coinsUsed > 0 ||
              order.coinsEarned > 0 ||
              !!order.customer?.referredBy;

            const isSelected = selectedIds.includes(order.id);

            return (
              <div
                key={order.id}
                className="dz-card"
                style={{
                  padding: "16px",
                  border: isSelected ? "1px solid var(--accent)" : undefined,
                }}
              >
                {/* Top row */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "12px",
                    flexWrap: "wrap",
                    gap: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => toggleOrder(order.id)}
                      disabled={bulkLoading || exportLoading}
                      aria-label={isSelected ? "Deselect order" : "Select order"}
                      style={{
                        border: 0,
                        padding: "2px",
                        background: "transparent",
                        color: isSelected ? "var(--accent)" : "var(--text-muted)",
                        cursor: "pointer",
                        display: "flex",
                        marginTop: "1px",
                      }}
                    >
                      {isSelected ? <CheckSquare size={19} /> : <Square size={19} />}
                    </button>

                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          marginBottom: "4px",
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "14px",
                            fontWeight: "700",
                            color: "var(--text-primary)",
                          }}
                        >
                          {order.orderNumber}
                        </span>

                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            background: `${cfg.color}15`,
                            color: cfg.color,
                            padding: "3px 8px",
                            borderRadius: "3px",
                            fontSize: "11px",
                            fontWeight: "700",
                          }}
                        >
                          <StatusIcon size={12} />
                          {cfg.label}
                        </span>
                      </div>

                      <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        {formatDate(order.createdAt)}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "var(--text-muted)",
                        marginBottom: "2px",
                      }}
                    >
                      Total (COD)
                    </div>

                    <div
                      style={{
                        fontSize: "18px",
                        fontWeight: "700",
                        color: "var(--accent)",
                        marginBottom: "4px",
                      }}
                    >
                      {money(order.total)}
                    </div>

                    {hasCoins && (
                      <div
                        style={{
                          display: "inline-flex",
                          flexDirection: "column",
                          alignItems: "flex-end",
                          gap: "2px",
                          background: "#FFFBEB",
                          padding: "4px 8px",
                          borderRadius: "3px",
                          fontSize: "11px",
                          color: "#B45309",
                          border: "1px solid #FDE68A",
                        }}
                      >
                        {order.coinsUsed > 0 && (
                          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <Coins size={10} />
                            Used: {money(order.coinsUsed)}
                          </span>
                        )}

                        {order.coinsEarned > 0 && (
                          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <Coins size={10} />
                            Earned: {money(order.coinsEarned)}
                          </span>
                        )}

                        {order.customer?.referredBy && (
                          <span style={{ fontWeight: "600" }}>
                            Ref: {order.customer.referredBy}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Customer */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "12px",
                    padding: "12px",
                    background: "var(--bg-alt)",
                    borderRadius: "3px",
                    marginBottom: "12px",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "2px" }}>
                      Customer
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: "500", color: "var(--text-primary)" }}>
                      {order.customerName}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "2px" }}>
                      Phone
                    </div>
                    <div style={{ fontSize: "13px", color: "var(--text-primary)" }}>
                      {order.customerPhone}
                    </div>
                  </div>

                  <div style={{ gridColumn: "1 / -1" }}>
                    <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "2px" }}>
                      Address
                    </div>
                    <div style={{ fontSize: "13px", color: "var(--text-primary)" }}>
                      {order.customerAddress}
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div style={{ marginBottom: "12px" }}>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "var(--text-muted)",
                      marginBottom: "6px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Items ({order.items.length})
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: "flex",
                          gap: "10px",
                          alignItems: "center",
                        }}
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          loading="lazy"
                          style={{
                            width: "36px",
                            height: "36px",
                            objectFit: "cover",
                            borderRadius: "3px",
                            flexShrink: 0,
                          }}
                        />

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="line-clamp-1" style={{ fontSize: "12px", color: "var(--text-primary)" }}>
                            {item.name}
                          </div>
                          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                            Qty: {item.quantity} × {money(item.price)}
                          </div>
                        </div>

                        <div style={{ fontSize: "12px", fontWeight: "500", color: "var(--text-primary)", whiteSpace: "nowrap" }}>
                          {money(item.price * item.quantity)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    justifyContent: "flex-end",
                    paddingTop: "12px",
                    borderTop: "1px solid var(--border)",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => printOrderLabel(order)}
                    className="dz-btn-secondary"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "12px",
                      padding: "8px 14px",
                      cursor: "pointer",
                    }}
                  >
                    <Printer size={14} />
                    Print Label
                  </button>

                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="dz-btn-secondary"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      textDecoration: "none",
                      fontSize: "12px",
                      padding: "8px 14px",
                    }}
                  >
                    <Eye size={14} />
                    View Details
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
