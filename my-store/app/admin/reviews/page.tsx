
"use client";

import { useEffect, useState } from "react";
import { Star, Trash2, Check, RefreshCw } from "lucide-react";

type Review = {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  status: string;
  createdAt: string;
  product: { id: string; name: string; image: string };
  order: { orderNumber: string };
};

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [error, setError] = useState("");

  async function loadReviews() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reviews", { cache: "no-store", credentials: "include" });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Could not load reviews");

      setReviews(data.reviews || []);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load reviews");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReviews();
  }, []);

  async function updateStatus(reviewId: string, status: string) {
    const res = await fetch("/api/admin/reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ reviewId, status }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Update failed");
      return;
    }

    await loadReviews();
  }

  async function deleteReview(reviewId: string) {
    if (!confirm("Delete this review permanently?")) return;

    const res = await fetch(`/api/admin/reviews?reviewId=${encodeURIComponent(reviewId)}`, {
      method: "DELETE",
      credentials: "include",
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Delete failed");
      return;
    }

    await loadReviews();
  }

  const filtered = reviews.filter((r) => filter === "ALL" || r.status === filter);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 27, fontWeight: 800 }}>Customer Reviews</h1>
          <p style={{ color: "#777", marginTop: 5 }}>Review, approve, or delete customer feedback.</p>
        </div>
        <button onClick={loadReviews} style={{ display: "flex", gap: 8, alignItems: "center", padding: "10px 14px", border: "1px solid #ddd", borderRadius: 8, background: "#fff", cursor: "pointer" }}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {error && <p style={{ color: "#dc2626", marginBottom: 15 }}>{error}</p>}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {["ALL", "PENDING", "APPROVED", "REJECTED"].map((s) => (
          <button key={s} onClick={() => setFilter(s)} style={{ padding: "9px 14px", borderRadius: 7, border: "1px solid #ddd", background: filter === s ? "#1b1b1c" : "#fff", color: filter === s ? "#fff" : "#333", cursor: "pointer" }}>
            {s} {s === "ALL" ? `(${reviews.length})` : `(${reviews.filter((r) => r.status === s).length})`}
          </button>
        ))}
      </div>

      {loading ? <p>Loading reviews...</p> : filtered.length === 0 ? (
        <div style={{ background: "#fff", padding: 30, borderRadius: 10, textAlign: "center" }}>No reviews found.</div>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {filtered.map((review) => (
            <div key={review.id} style={{ background: "#fff", padding: 20, borderRadius: 10, border: "1px solid #eee" }}>
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                {review.product.image && <img src={review.product.image} alt={review.product.name} style={{ width: 58, height: 58, objectFit: "contain" }} />}
                <div style={{ flex: 1 }}>
                  <strong>{review.product.name}</strong>
                  <div style={{ fontSize: 13, color: "#777", marginTop: 4 }}>Order: {review.order.orderNumber}</div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700 }}>{review.status}</span>
              </div>

              <div style={{ display: "flex", gap: 3, margin: "14px 0 8px", color: "#f59e0b" }}>
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={16} fill={i < review.rating ? "currentColor" : "none"} />)}
              </div>

              <p style={{ fontWeight: 700 }}>{review.customerName}</p>
              <p style={{ color: "#555", marginTop: 7, whiteSpace: "pre-wrap" }}>{review.comment}</p>
              <p style={{ fontSize: 12, color: "#999", marginTop: 8 }}>{new Date(review.createdAt).toLocaleString()}</p>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 15 }}>
                {review.status !== "APPROVED" && (
                  <button onClick={() => updateStatus(review.id, "APPROVED")} style={{ display: "flex", gap: 6, alignItems: "center", padding: "9px 13px", background: "#16a34a", color: "#fff", border: 0, borderRadius: 7, cursor: "pointer" }}>
                    <Check size={15} /> Approve
                  </button>
                )}
                {review.status !== "REJECTED" && (
                  <button onClick={() => updateStatus(review.id, "REJECTED")} style={{ padding: "9px 13px", background: "#eee", border: 0, borderRadius: 7, cursor: "pointer" }}>Reject</button>
                )}
                <button onClick={() => deleteReview(review.id)} style={{ display: "flex", gap: 6, alignItems: "center", padding: "9px 13px", background: "#fee2e2", color: "#b91c1c", border: 0, borderRadius: 7, cursor: "pointer" }}>
                  <Trash2 size={15} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
