
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Star, Package, Send } from "lucide-react";

type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  status: string;
  createdAt: string;
  items: {
    id: string;
    productId: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
  }[];
  reviews: {
    id: string;
    productId: string;
    status: string;
  }[];
};

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<{ orderId: string; productId: string } | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function loadOrders() {
    try {
      const res = await fetch("/api/customer/orders", { cache: "no-store" });
      const data = await res.json();
      if (res.ok) setOrders(data.orders || []);
    } catch {
      setMessage("Unable to load your orders.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  async function submitReview() {
    if (!selected || !comment.trim()) {
      setMessage("Please write your review.");
      return;
    }

    setSending(true);
    setMessage("");

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          orderId: selected.orderId,
          productId: selected.productId,
          rating,
          comment,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Review submission failed.");
        return;
      }

      setMessage("Review submitted. It will appear after admin approval.");
      setSelected(null);
      setComment("");
      await loadOrders();
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center" }}>Loading your orders...</div>;
  }

  return (
    <main style={{ maxWidth: 950, margin: "0 auto", padding: "30px 18px", color: "#222" }}>
      <Link href="/cart" style={{ display: "inline-flex", gap: 8, alignItems: "center", color: "#555", textDecoration: "none", marginBottom: 24 }}>
        <ArrowLeft size={18} /> Back to Cart
      </Link>

      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>My Order History</h1>
      <p style={{ color: "#777", marginBottom: 25 }}>View your orders and review products you purchased.</p>

      {message && (
        <div style={{ padding: 14, borderRadius: 8, background: "#f1f5f9", marginBottom: 18 }}>
          {message}
        </div>
      )}

      {orders.length === 0 ? (
        <div style={{ padding: 35, textAlign: "center", border: "1px solid #eee", borderRadius: 12 }}>
          <Package size={35} />
          <h2 style={{ marginTop: 12 }}>No orders found</h2>
          <p style={{ color: "#777", margin: "10px 0 20px" }}>Orders placed from this browser will appear here.</p>
          <Link href="/" style={{ color: "#2563eb" }}>Start Shopping</Link>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 18 }}>
          {orders.map((order) => (
            <section key={order.id} style={{ border: "1px solid #e5e5e5", borderRadius: 12, padding: 20 }}>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 10, marginBottom: 16 }}>
                <div>
                  <strong>{order.orderNumber}</strong>
                  <div style={{ fontSize: 13, color: "#777", marginTop: 5 }}>
                    {new Date(order.createdAt).toLocaleString()}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <strong>Rs. {order.total.toLocaleString()}</strong>
                  <div style={{ fontSize: 13, marginTop: 5 }}>{order.status}</div>
                </div>
              </div>

              {order.items.map((item) => {
                const reviewed = order.reviews.some((r) => r.productId === item.productId);

                return (
                  <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 14, borderTop: "1px solid #eee", padding: "14px 0" }}>
                    {item.image && (
                      <img src={item.image} alt={item.name} style={{ width: 65, height: 65, objectFit: "contain", borderRadius: 8 }} />
                    )}
                    <div style={{ flex: 1 }}>
                      <strong>{item.name}</strong>
                      <div style={{ fontSize: 13, color: "#777", marginTop: 5 }}>
                        Qty: {item.quantity} · Rs. {item.price.toLocaleString()}
                      </div>
                    </div>
                    {reviewed ? (
                      <span style={{ fontSize: 13, color: "#777" }}>Review submitted</span>
                    ) : (
                      <button
                        onClick={() => {
                          setSelected({ orderId: order.id, productId: item.productId });
                          setRating(5);
                          setComment("");
                          setMessage("");
                        }}
                        style={{ border: 0, background: "#1b1b1c", color: "#fff", padding: "9px 13px", borderRadius: 7, cursor: "pointer", display: "flex", gap: 6, alignItems: "center" }}
                      >
                        <Star size={15} /> Review
                      </button>
                    )}
                  </div>
                );
              })}
            </section>
          ))}
        </div>
      )}

      {selected && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "#0008", display: "grid", placeItems: "center", padding: 16 }}>
          <div style={{ background: "#fff", width: "100%", maxWidth: 450, borderRadius: 14, padding: 24 }}>
            <h2 style={{ fontSize: 21, fontWeight: 800 }}>Write a Review</h2>
            <p style={{ color: "#777", fontSize: 13, marginTop: 5 }}>Your review will be visible after approval.</p>

            <div style={{ display: "flex", gap: 8, margin: "20px 0" }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setRating(n)} aria-label={`${n} stars`} style={{ border: 0, background: "transparent", cursor: "pointer", color: n <= rating ? "#f59e0b" : "#ccc" }}>
                  <Star size={28} fill={n <= rating ? "currentColor" : "none"} />
                </button>
              ))}
            </div>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={1500}
              placeholder="Write your experience..."
              rows={5}
              style={{ width: "100%", padding: 12, border: "1px solid #ddd", borderRadius: 8, resize: "vertical" }}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
              <button onClick={() => setSelected(null)} style={{ padding: "10px 16px", border: "1px solid #ddd", borderRadius: 7, background: "#fff", cursor: "pointer" }}>Cancel</button>
              <button disabled={sending} onClick={submitReview} style={{ padding: "10px 16px", border: 0, borderRadius: 7, background: "#1b1b1c", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 7 }}>
                <Send size={15} /> {sending ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
