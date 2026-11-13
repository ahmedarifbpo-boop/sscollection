
"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Star,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface OrderProduct {
  productId: string;
  name: string;
  image: string;
  quantity: number;
}

interface OrderData {
  orderNumber: string;
  customerName: string;
  items: OrderProduct[];
}

export default function ReviewOrderPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, string>>({});

  // Load order using secure review token
  useEffect(() => {
    if (!token) {
      setError("Review link is invalid.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadOrder = async () => {
      try {
        const response = await fetch(
          `/api/review-order/${encodeURIComponent(token)}`,
          {
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to load order.");
        }

        if (!data.order || !Array.isArray(data.order.items)) {
          throw new Error("Invalid order information.");
        }

        if (!cancelled) {
          setOrder(data.order);
          setSubmitted(data.submittedProductIds || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Something went wrong."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadOrder();

    return () => {
      cancelled = true;
    };
  }, [token]);

  // Submit individual product review
  const submitReview = async (productId: string) => {
    const rating = ratings[productId] || 0;
    const comment = comments[productId]?.trim() || "";

    if (rating < 1 || rating > 5) {
      setMessages((prev) => ({
        ...prev,
        [productId]: "Please select a star rating.",
      }));
      return;
    }

    if (comment.length < 5) {
      setMessages((prev) => ({
        ...prev,
        [productId]: "Please write at least 5 characters.",
      }));
      return;
    }

    if (submitting) return;

    setSubmitting(productId);

    setMessages((prev) => ({
      ...prev,
      [productId]: "",
    }));

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          productId,
          rating,
          comment,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Review submission failed."
        );
      }

      setSubmitted((prev) =>
        prev.includes(productId)
          ? prev
          : [...prev, productId]
      );

      setMessages((prev) => ({
        ...prev,
        [productId]: "Your review has been submitted for approval!",
      }));
    } catch (err) {
      setMessages((prev) => ({
        ...prev,
        [productId]:
          err instanceof Error
            ? err.message
            : "Something went wrong.",
      }));
    } finally {
      setSubmitting(null);
    }
  };

  // Loading screen
  if (loading) {
    return (
      <main style={styles.center}>
        <Loader2
          className="animate-spin"
          size={35}
          color="#2563eb"
        />
        <p>Loading your order...</p>
      </main>
    );
  }

  // Invalid token or order
  if (error || !order) {
    return (
      <main style={styles.center}>
        <AlertCircle size={55} color="#ef4444" />

        <h2>Invalid Review Link</h2>

        <p>
          {error || "This review link is invalid or unavailable."}
        </p>

        <Link href="/" style={styles.button}>
          Go to Home
        </Link>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        {/* Page Header */}
        <div style={styles.header}>
          <CheckCircle2 size={42} color="#16a34a" />

          <h1 style={styles.heading}>
            Review Your Products
          </h1>

          <p style={styles.intro}>
            Hi {order.customerName}, share your experience with
            the products you ordered.
          </p>

          <p style={styles.orderNumber}>
            Order: {order.orderNumber}
          </p>
        </div>

        {/* Products */}
        {order.items.map((item) => {
          const alreadySubmitted = submitted.includes(
            item.productId
          );

          const currentRating = ratings[item.productId] || 0;

          return (
            <section
              key={item.productId}
              style={styles.card}
            >
              {/* Product Information */}
              <div style={styles.product}>
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.name}
                    style={styles.image}
                  />
                )}

                <div>
                  <h3 style={styles.productName}>
                    {item.name}
                  </h3>

                  <p style={styles.muted}>
                    Quantity: {item.quantity}
                  </p>
                </div>
              </div>

              {/* Already Submitted */}
              {alreadySubmitted ? (
                <div style={styles.success}>
                  <CheckCircle2 size={20} />

                  <span>
                    Review submitted successfully. Awaiting
                    admin approval.
                  </span>
                </div>
              ) : (
                <>
                  {/* Rating */}
                  <p style={styles.label}>
                    Your Rating
                  </p>

                  <div style={styles.stars}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() =>
                          setRatings((prev) => ({
                            ...prev,
                            [item.productId]: star,
                          }))
                        }
                        style={{
                          ...styles.starButton,
                          color:
                            star <= currentRating
                              ? "#f59e0b"
                              : "#d1d5db",
                        }}
                        aria-label={`${star} stars`}
                        aria-pressed={currentRating === star}
                      >
                        <Star
                          size={30}
                          fill={
                            star <= currentRating
                              ? "#f59e0b"
                              : "none"
                          }
                        />
                      </button>
                    ))}
                  </div>

                  {/* Comment */}
                  <p style={styles.label}>
                    Write Your Review
                  </p>

                  <textarea
                    value={comments[item.productId] || ""}
                    onChange={(e) =>
                      setComments((prev) => ({
                        ...prev,
                        [item.productId]: e.target.value,
                      }))
                    }
                    placeholder="Share your experience..."
                    maxLength={1000}
                    style={styles.textarea}
                  />

                  <p style={styles.charCount}>
                    {(comments[item.productId] || "").length}/1000
                  </p>

                  {/* Submit */}
                  <button
                    type="button"
                    onClick={() =>
                      submitReview(item.productId)
                    }
                    disabled={submitting !== null}
                    style={{
                      ...styles.button,
                      opacity:
                        submitting !== null ? 0.6 : 1,
                      cursor:
                        submitting !== null
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    {submitting === item.productId
                      ? "Submitting..."
                      : "Submit Review"}
                  </button>

                  {/* Message */}
                  {messages[item.productId] && (
                    <p
                      style={{
                        ...styles.message,
                        color: messages[item.productId].includes(
                          "submitted for approval"
                        )
                          ? "#15803d"
                          : "#dc2626",
                      }}
                    >
                      {messages[item.productId]}
                    </p>
                  )}
                </>
              )}
            </section>
          );
        })}

        {/* Footer */}
        <div style={styles.footer}>
          <Link href="/" style={styles.homeLink}>
            Continue Shopping
          </Link>
        </div>
      </div>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    padding: "35px 15px",
    color: "#111827",
  },

  container: {
    maxWidth: "700px",
    margin: "0 auto",
  },

  center: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: "15px",
    padding: "20px",
    textAlign: "center",
    background: "#f8fafc",
  },

  header: {
    textAlign: "center",
    marginBottom: "30px",
  },

  heading: {
    fontSize: "26px",
    fontWeight: "700",
    marginTop: "12px",
    marginBottom: "8px",
  },

  intro: {
    color: "#6b7280",
    fontSize: "14px",
  },

  orderNumber: {
    fontWeight: "700",
    color: "#2563eb",
    marginTop: "10px",
  },

  card: {
    background: "#fff",
    padding: "22px",
    borderRadius: "14px",
    marginBottom: "18px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 3px 12px rgba(0,0,0,0.04)",
  },

  product: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    marginBottom: "20px",
  },

  productName: {
    fontSize: "16px",
    fontWeight: "600",
  },

  image: {
    width: "85px",
    height: "85px",
    objectFit: "cover",
    borderRadius: "10px",
    background: "#f3f4f6",
  },

  muted: {
    color: "#6b7280",
    fontSize: "13px",
    marginTop: "5px",
  },

  label: {
    fontWeight: "600",
    marginBottom: "9px",
    fontSize: "14px",
  },

  stars: {
    display: "flex",
    gap: "7px",
    marginBottom: "20px",
  },

  starButton: {
    background: "none",
    border: "none",
    padding: "2px",
    cursor: "pointer",
  },

  textarea: {
    width: "100%",
    minHeight: "110px",
    padding: "12px",
    border: "1px solid #d1d5db",
    borderRadius: "9px",
    resize: "vertical",
    fontSize: "14px",
    boxSizing: "border-box",
    marginBottom: "5px",
    fontFamily: "inherit",
  },

  charCount: {
    textAlign: "right",
    color: "#9ca3af",
    fontSize: "11px",
    marginBottom: "15px",
  },

  button: {
    display: "inline-block",
    background: "#111827",
    color: "#fff",
    border: "none",
    padding: "12px 22px",
    borderRadius: "8px",
    fontWeight: "600",
    textDecoration: "none",
    cursor: "pointer",
  },

  success: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#15803d",
    background: "#f0fdf4",
    padding: "13px",
    borderRadius: "8px",
    fontSize: "14px",
  },

  message: {
    marginTop: "12px",
    fontSize: "14px",
  },

  footer: {
    textAlign: "center",
    padding: "20px",
  },

  homeLink: {
    color: "#2563eb",
    textDecoration: "none",
    fontWeight: "600",
  },
};
