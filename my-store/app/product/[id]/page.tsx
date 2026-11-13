
"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Star,
  ShoppingCart,
  Minus,
  Plus,
  Truck,
  ShieldCheck,
  RotateCcw,
  Check,
  Play,
  MessageSquare,
} from "lucide-react";
import { useCart } from "@/lib/cart";

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  salePrice: number | null;
  stock: number;
  isManuallyOutOfStock: boolean;
  image: string;
  images?: string[];
  video?: string | null;
  rating: number;
  reviews: number;
}

interface Review {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  verifiedPurchase: boolean;
  createdAt: string;
}

function ProductContent() {
  const params = useParams();
  const id = params.id as string;

  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const [selectedImage, setSelectedImage] = useState("");
  const [showVideo, setShowVideo] = useState(false);

  const [shippingFee, setShippingFee] = useState(250);
  const [freeThreshold, setFreeThreshold] = useState(5000);
  const [enableFreeShipping, setEnableFreeShipping] = useState(true);

  // Approved Reviews
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  // Load settings and product
  useEffect(() => {
    fetch("/api/settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) {
          setShippingFee(d.settings.shippingFee ?? 250);
          setFreeThreshold(d.settings.freeShippingThreshold ?? 5000);
          setEnableFreeShipping(d.settings.enableFreeShipping ?? true);
        }
      })
      .catch(console.error);

    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products/${id}`, {
          cache: "no-store",
        });

        if (res.status === 404) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        if (!res.ok) {
          throw new Error("Product request failed");
        }

        const data = await res.json();
        const prod: Product = data.product;

        setProduct(prod);

        const productImages = prod.images?.filter(Boolean) || [];

        setSelectedImage(productImages[0] || prod.image || "");
        setShowVideo(false);
        setQuantity(1);

        const allRes = await fetch("/api/products", {
          cache: "no-store",
        });

        if (allRes.ok) {
          const allData = await allRes.json();

          const filtered = (allData.products || []).filter(
            (p: Product) =>
              p.category === prod.category && p.id !== prod.id
          );

          setRelated(filtered.slice(0, 4));
        }
      } catch (e) {
        console.error("Failed to load product:", e);
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchProduct();
  }, [id]);

  // Fetch approved reviews
  useEffect(() => {
    if (!id) return;

    async function fetchReviews() {
      try {
        setReviewsLoading(true);

        const response = await fetch(
          `/api/reviews?productId=${encodeURIComponent(id)}`,
          { cache: "no-store" }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load reviews");
        }

        setReviews(data.reviews || []);
      } catch (error) {
        console.error("Reviews loading error:", error);
      } finally {
        setReviewsLoading(false);
      }
    }

    fetchReviews();
  }, [id]);

  if (loading) {
    return (
      <div style={{ padding: "60px", textAlign: "center" }}>
        Loading...
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div style={{ padding: "60px", textAlign: "center" }}>
        Product not found
      </div>
    );
  }

  const productImages = product.images?.filter(Boolean).length
    ? product.images.filter(Boolean)
    : product.image
      ? [product.image]
      : [];

  const discount = product.salePrice
    ? Math.round(
        ((product.price - product.salePrice) / product.price) * 100
      )
    : 0;

  const finalPrice = product.salePrice || product.price;

  // Automatic + Manual Out of Stock
  const isOutOfStock =
    product.stock <= 0 || product.isManuallyOutOfStock;

  // Add to Cart
  const handleAddToCart = () => {
    if (isOutOfStock || quantity > product.stock) return;

    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        salePrice: product.salePrice,
        image: productImages[0] || "",
      });
    }

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div
      style={{
        background: "var(--bg)",
        minHeight: "100vh",
        padding: "24px",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            color: "var(--text-secondary)",
            fontSize: "13px",
            marginBottom: "20px",
            textDecoration: "none",
          }}
        >
          <ArrowLeft size={16} /> Back to Home
        </Link>

        <div
          className="dz-card product-detail-grid"
          style={{
            padding: "24px",
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "32px",
          }}
        >
          {/* PRODUCT IMAGE GALLERY */}

          <div className="product-gallery">
            <div
              style={{
                position: "relative",
                width: "100%",
                aspectRatio: "1 / 1",
                maxHeight: "420px",
                overflow: "hidden",
                borderRadius: "3px",
                background: "var(--bg-alt)",
              }}
            >
              {showVideo && product.video ? (
                <video
                  key={product.video}
                  src={product.video}
                  poster={selectedImage || undefined}
                  controls
                  autoPlay
                  playsInline
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    background: "#000",
                  }}
                />
              ) : selectedImage ? (
                <img
                  src={selectedImage}
                  alt={product.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                />
              ) : (
                <div
                  style={{
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--text-muted)",
                  }}
                >
                  No image available
                </div>
              )}

              {discount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "12px",
                    left: "12px",
                    background: "var(--accent)",
                    color: "#fff",
                    fontSize: "13px",
                    fontWeight: "700",
                    padding: "4px 10px",
                    borderRadius: "2px",
                  }}
                >
                  -{discount}% OFF
                </span>
              )}
            </div>

            {/* THUMBNAILS */}

            {(productImages.length > 1 || product.video) && (
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  marginTop: "12px",
                  overflowX: "auto",
                  paddingBottom: "6px",
                }}
              >
                {productImages.map((img, index) => (
                  <button
                    key={`${img}-${index}`}
                    onClick={() => {
                      setSelectedImage(img);
                      setShowVideo(false);
                    }}
                    aria-label={`Show product image ${index + 1}`}
                    style={{
                      flex: "0 0 76px",
                      width: "76px",
                      height: "76px",
                      padding: "3px",
                      borderRadius: "3px",
                      overflow: "hidden",
                      border:
                        !showVideo && selectedImage === img
                          ? "2px solid var(--accent)"
                          : "1px solid var(--border)",
                      background: "var(--bg-alt)",
                      cursor: "pointer",
                    }}
                  >
                    <img
                      src={img}
                      alt={`${product.name} ${index + 1}`}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </button>
                ))}

                {product.video && (
                  <button
                    onClick={() => setShowVideo(true)}
                    aria-label="Play product video"
                    style={{
                      flex: "0 0 76px",
                      width: "76px",
                      height: "76px",
                      borderRadius: "3px",
                      border: showVideo
                        ? "2px solid var(--accent)"
                        : "1px solid var(--border)",
                      background: "#222",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "column",
                      gap: "4px",
                      cursor: "pointer",
                    }}
                  >
                    <Play size={24} />
                    <span style={{ fontSize: "10px" }}>Video</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* PRODUCT DETAILS */}

          <div>
            <p
              style={{
                fontSize: "12px",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "8px",
              }}
            >
              {product.category}
            </p>

            <h1
              style={{
                fontSize: "22px",
                fontWeight: "500",
                color: "var(--text-primary)",
                lineHeight: "30px",
                marginBottom: "12px",
              }}
            >
              {product.name}
            </h1>

            {/* STOCK STATUS */}

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "7px 12px",
                borderRadius: "3px",
                marginBottom: "14px",
                background: isOutOfStock ? "#FEE2E2" : "#DCFCE7",
                color: isOutOfStock ? "#B91C1C" : "#15803D",
                fontSize: "12px",
                fontWeight: "600",
              }}
            >
              <span
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: isOutOfStock ? "#DC2626" : "#16A34A",
                }}
              />

              {isOutOfStock ? "Out of Stock" : "In Stock"}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "16px",
                paddingBottom: "16px",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div style={{ display: "flex", gap: "2px" }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={14}
                    style={{
                      fill:
                        s <= Math.round(product.rating)
                          ? "#FFB800"
                          : "transparent",
                      color: "#FFB800",
                    }}
                  />
                ))}
              </div>

              <span
                style={{
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                }}
              >
                {Number(product.rating || 0).toFixed(1)}
              </span>

              <span
                style={{
                  fontSize: "13px",
                  color: "var(--text-muted)",
                }}
              >
                ({product.reviews} reviews)
              </span>
            </div>

            {/* PRICE */}

            <div
              style={{
                background: "var(--bg-alt)",
                padding: "16px",
                borderRadius: "3px",
                marginBottom: "20px",
              }}
            >
              {product.salePrice ? (
                <>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: "10px",
                      marginBottom: "4px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "28px",
                        fontWeight: "700",
                        color: "var(--accent)",
                      }}
                    >
                      Rs. {product.salePrice.toLocaleString()}
                    </span>

                    <span
                      style={{
                        fontSize: "14px",
                        color: "var(--text-muted)",
                        textDecoration: "line-through",
                      }}
                    >
                      Rs. {product.price.toLocaleString()}
                    </span>
                  </div>

                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--accent)",
                      fontWeight: "500",
                    }}
                  >
                    You save Rs.{" "}
                    {(product.price - product.salePrice).toLocaleString()}
                  </div>
                </>
              ) : (
                <span
                  style={{
                    fontSize: "28px",
                    fontWeight: "700",
                    color: "var(--accent)",
                  }}
                >
                  Rs. {product.price.toLocaleString()}
                </span>
              )}
            </div>

            {/* DESCRIPTION */}

            <div style={{ marginBottom: "20px" }}>
              <h2
                style={{
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "var(--text-primary)",
                  marginBottom: "8px",
                }}
              >
                Description
              </h2>

              <p
                style={{
                  fontSize: "14px",
                  color: "var(--text-secondary)",
                  lineHeight: "22px",
                }}
              >
                {product.description}
              </p>
            </div>

            {/* QUANTITY */}

            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: "500",
                  color: "var(--text-primary)",
                  marginBottom: "8px",
                }}
              >
                Quantity
              </label>

              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  border: "1px solid var(--border-strong)",
                  borderRadius: "3px",
                  background: "var(--surface)",
                  opacity: isOutOfStock ? 0.5 : 1,
                }}
              >
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={isOutOfStock || quantity <= 1}
                  style={{
                    padding: "10px 14px",
                    background: "transparent",
                    border: "none",
                    color: "var(--text-secondary)",
                    cursor:
                      isOutOfStock || quantity <= 1
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  <Minus size={16} />
                </button>

                <span
                  style={{
                    fontSize: "15px",
                    fontWeight: "500",
                    minWidth: "40px",
                    textAlign: "center",
                  }}
                >
                  {quantity}
                </span>

                <button
                  onClick={() =>
                    setQuantity(Math.min(product.stock, quantity + 1))
                  }
                  disabled={isOutOfStock || quantity >= product.stock}
                  style={{
                    padding: "10px 14px",
                    background: "transparent",
                    border: "none",
                    color: "var(--text-secondary)",
                    cursor:
                      isOutOfStock || quantity >= product.stock
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  <Plus size={16} />
                </button>
              </div>

              {isOutOfStock && (
                <p
                  style={{
                    fontSize: "12px",
                    color: "#DC2626",
                    marginTop: "8px",
                  }}
                >
                  This product is currently unavailable.
                </p>
              )}
            </div>

            {/* ADD TO CART */}

            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock || added}
              className="dz-btn-primary"
              style={{
                width: "100%",
                padding: "14px",
                fontSize: "15px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                marginBottom: "16px",
                opacity: isOutOfStock ? 0.55 : 1,
                cursor: isOutOfStock ? "not-allowed" : "pointer",
                background: isOutOfStock ? "#777" : undefined,
              }}
            >
              {isOutOfStock ? (
                "Out of Stock"
              ) : added ? (
                <>
                  <Check size={18} /> Added to Cart!
                </>
              ) : (
                <>
                  <ShoppingCart size={18} />
                  Add to Cart — Rs.{" "}
                  {(finalPrice * quantity).toLocaleString()}
                </>
              )}
            </button>

            {/* DELIVERY FEATURES */}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "12px",
                paddingTop: "16px",
                borderTop: "1px solid var(--border)",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <Truck
                  size={20}
                  style={{
                    color: "var(--accent)",
                    marginBottom: "6px",
                  }}
                />
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--text-secondary)",
                    lineHeight: "15px",
                  }}
                >
                  Fast Delivery
                </div>
              </div>

              <div style={{ textAlign: "center" }}>
                <ShieldCheck
                  size={20}
                  style={{
                    color: "var(--accent)",
                    marginBottom: "6px",
                  }}
                />
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--text-secondary)",
                    lineHeight: "15px",
                  }}
                >
                  Cash on Delivery
                </div>
              </div>

              <div style={{ textAlign: "center" }}>
                <RotateCcw
                  size={20}
                  style={{
                    color: "var(--accent)",
                    marginBottom: "6px",
                  }}
                />
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--text-secondary)",
                    marginBottom: "6px",
                    lineHeight: "15px",
                  }}
                >
                  Easy Returns
                </div>
              </div>
            </div>

            {/* SHIPPING */}

            <div
              style={{
                fontSize: "12px",
                color: "var(--text-muted)",
                marginTop: "16px",
                textAlign: "center",
                background: "var(--bg-alt)",
                padding: "10px",
                borderRadius: "3px",
              }}
            >
              🚚 Shipping:{" "}
              <strong>
                {shippingFee === 0 ? "Free" : `Rs. ${shippingFee}`}
              </strong>

              {enableFreeShipping &&
                freeThreshold > 0 &&
                ` (Free delivery on orders above Rs. ${freeThreshold.toLocaleString()})`}
            </div>
          </div>
        </div>

        {/* CUSTOMER REVIEWS */}

        <section
          id="reviews"
          style={{
            marginTop: "36px",
            padding: "24px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "4px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "8px",
            }}
          >
            <MessageSquare size={21} color="var(--accent)" />

            <h2
              style={{
                fontSize: "21px",
                fontWeight: "600",
                color: "var(--text-primary)",
              }}
            >
              Customer Reviews
            </h2>
          </div>

          <p
            style={{
              fontSize: "13px",
              color: "var(--text-secondary)",
              marginBottom: "22px",
            }}
          >
            Read reviews from customers who purchased this product.
          </p>

          {/* REVIEW LINK INFORMATION */}

          <div
            style={{
              background: "var(--bg-alt)",
              padding: "20px",
              borderRadius: "4px",
              marginBottom: "28px",
              border: "1px solid var(--border)",
            }}
          >
            <h3
              style={{
                fontSize: "16px",
                fontWeight: "600",
                color: "var(--text-primary)",
                marginBottom: "8px",
              }}
            >
              Want to Write a Review?
            </h3>

            <p
              style={{
                fontSize: "13px",
                color: "var(--text-secondary)",
                lineHeight: "21px",
              }}
            >
              Reviews are available to verified customers through
              their personal order review link. Please use the
              review link provided after placing your order.
            </p>
          </div>

          {/* APPROVED REVIEWS LIST */}

          <div>
            <h3
              style={{
                fontSize: "16px",
                fontWeight: "600",
                color: "var(--text-primary)",
                marginBottom: "16px",
              }}
            >
              Customer Feedback ({reviews.length})
            </h3>

            {reviewsLoading ? (
              <p
                style={{
                  padding: "20px",
                  textAlign: "center",
                  color: "var(--text-secondary)",
                  fontSize: "13px",
                }}
              >
                Loading reviews...
              </p>
            ) : reviews.length === 0 ? (
              <div
                style={{
                  padding: "28px 16px",
                  textAlign: "center",
                  background: "var(--bg-alt)",
                  borderRadius: "4px",
                }}
              >
                <MessageSquare
                  size={28}
                  color="var(--text-muted)"
                  style={{ margin: "0 auto 10px" }}
                />

                <p
                  style={{
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "var(--text-primary)",
                  }}
                >
                  No reviews yet
                </p>

                <p
                  style={{
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                    marginTop: "5px",
                  }}
                >
                  Customer feedback will appear here after approval.
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                {reviews.map((review) => (
                  <article
                    key={review.id}
                    style={{
                      padding: "16px",
                      border: "1px solid var(--border)",
                      borderRadius: "4px",
                      background: "var(--surface)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: "12px",
                        flexWrap: "wrap",
                      }}
                    >
                      <div>
                        <h4
                          style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "var(--text-primary)",
                          }}
                        >
                          {review.customerName}
                        </h4>

                        <div
                          style={{
                            display: "flex",
                            gap: "2px",
                            marginTop: "5px",
                          }}
                        >
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={14}
                              color="#FFB800"
                              fill={
                                star <= review.rating
                                  ? "#FFB800"
                                  : "transparent"
                              }
                            />
                          ))}
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        {review.verifiedPurchase && (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "11px",
                              fontWeight: "600",
                              color: "#15803D",
                              background: "#DCFCE7",
                              padding: "5px 8px",
                              borderRadius: "3px",
                            }}
                          >
                            <Check size={12} />
                            Verified Purchase
                          </span>
                        )}

                        <p
                          style={{
                            fontSize: "11px",
                            color: "var(--text-muted)",
                            marginTop: "6px",
                          }}
                        >
                          {new Date(
                            review.createdAt
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <p
                      style={{
                        fontSize: "13px",
                        lineHeight: "21px",
                        color: "var(--text-secondary)",
                        marginTop: "12px",
                        whiteSpace: "pre-wrap",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {review.comment}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* RELATED PRODUCTS */}

        {related.length > 0 && (
          <section style={{ marginTop: "32px" }}>
            <h2 className="dz-section-title">You may also like</h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fill, minmax(180px, 1fr))",
                gap: "12px",
              }}
            >
              {related.map((p) => (
                <Link
                  key={p.id}
                  href={`/product/${p.id}`}
                  className="dz-card dz-card-hover"
                  style={{
                    overflow: "hidden",
                    display: "block",
                    textDecoration: "none",
                  }}
                >
                  <div
                    style={{
                      aspectRatio: "1 / 1",
                      overflow: "hidden",
                      background: "var(--bg-alt)",
                      position: "relative",
                    }}
                  >
                    <img
                      src={p.images?.[0] || p.image}
                      alt={p.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />

                    {(p.stock <= 0 || p.isManuallyOutOfStock) && (
                      <span
                        style={{
                          position: "absolute",
                          bottom: "8px",
                          left: "8px",
                          background: "#DC2626",
                          color: "#fff",
                          fontSize: "10px",
                          fontWeight: "600",
                          padding: "5px 8px",
                          borderRadius: "3px",
                        }}
                      >
                        Out of Stock
                      </span>
                    )}
                  </div>

                  <div style={{ padding: "10px" }}>
                    <h3
                      className="line-clamp-2"
                      style={{
                        fontSize: "12px",
                        marginBottom: "6px",
                        minHeight: "32px",
                      }}
                    >
                      {p.name}
                    </h3>

                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: "700",
                        color: "var(--accent)",
                      }}
                    >
                      Rs.{" "}
                      {(p.salePrice || p.price).toLocaleString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      <style jsx>{`
        @media (min-width: 768px) {
          .product-detail-grid {
            grid-template-columns: 1fr 1fr !important;
          }

          .product-gallery {
            max-width: 420px;
            width: 100%;
            margin: 0 auto;
          }
        }

        @media (max-width: 767px) {
          .product-gallery {
            max-width: 340px;
            width: 100%;
            margin: 0 auto;
          }

          .product-detail-grid {
            padding: 16px !important;
            gap: 24px !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function ProductDetailPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: "60px", textAlign: "center" }}>
          Loading...
        </div>
      }
    >
      <ProductContent />
    </Suspense>
  );
}
