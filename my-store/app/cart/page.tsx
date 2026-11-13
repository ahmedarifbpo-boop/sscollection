
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
  ShoppingCart,
  ArrowLeft,
  Minus,
  Plus,
  Trash2,
  CheckCircle2,
  X,
  Coins,
  Gift,
  Truck,
  ShieldCheck,
  Package,
  Star,
  Clock,
  MessageSquare,
  RefreshCw,
  RotateCcw,
  Image as ImageIcon,
  Video,
  Upload,
} from "lucide-react";
import { useCart } from "@/lib/cart";

type OrderItem = {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
};

type CustomerOrder = {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  subtotal: number;
  shipping: number;
  createdAt: string;
  customerPhone?: string;
  customerEmail?: string | null;
  customerAddress?: string;
  items: OrderItem[];
  reviews?: {
    id: string;
    productId: string;
    rating: number;
    comment: string;
    status: string;
  }[];
};

export default function CartPage() {
  const router = useRouter();
  const orderRequestRef = useRef(false);

  const {
    items,
    removeFromCart,
    updateQuantity,
    totalPrice,
    totalItems,
    clearCart,
  } = useCart();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });

  const [showSuccess, setShowSuccess] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [orderSnapshot, setOrderSnapshot] = useState<any>(null);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");

  const [settings, setSettings] = useState({
    shippingFee: 250,
    freeShippingThreshold: 5000,
    enableFreeShipping: true,
  });

  // Coins
  const [totalCoins, setTotalCoins] = useState(0);
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [referralCoins, setReferralCoins] = useState(0);
  const [useCoins, setUseCoins] = useState(false);
  const [checkingCoins, setCheckingCoins] = useState(false);

  // Order history
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  const [showOrders, setShowOrders] = useState(false);

  // Review
  const [reviewOrder, setReviewOrder] = useState<CustomerOrder | null>(null);
  const [reviewProduct, setReviewProduct] = useState<OrderItem | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewError, setReviewError] = useState("");

  // Return request
  const [returnOrder, setReturnOrder] = useState<CustomerOrder | null>(null);
  const [returnReason, setReturnReason] = useState("");
  const [returnDetails, setReturnDetails] = useState("");
  const [returnImages, setReturnImages] = useState<File[]>([]);
  const [returnVideos, setReturnVideos] = useState<File[]>([]);
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [returnError, setReturnError] = useState("");
  const [returnMessage, setReturnMessage] = useState("");
  const [submittedReturnIds, setSubmittedReturnIds] = useState<string[]>([]);

  // Return customer details
  const [returnCustomer, setReturnCustomer] = useState({
    phone: "",
    email: "",
    address: "",
  });

  // Auto-fill customer details
  useEffect(() => {
    try {
      const savedCustomer = localStorage.getItem("ss-customer");

      if (savedCustomer) {
        const customer = JSON.parse(savedCustomer);

        setForm((prev) => ({
          ...prev,
          name: customer.name || "",
          phone: customer.phone || "",
          email: customer.email || "",
        }));
      }
    } catch (err) {
      console.error("Customer data error:", err);
    }
  }, []);

  // Load customer's private order history using HTTP-only cookie
  const loadOrderHistory = async () => {
    setLoadingOrders(true);
    setOrdersError("");

    try {
      const res = await fetch("/api/customer/orders", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Unable to load your orders.");
      }

      setOrders(data.orders || []);
    } catch (err: any) {
      setOrdersError(err.message || "Unable to load your orders.");
    } finally {
      setLoadingOrders(false);
    }
  };

  // Load settings
  useEffect(() => {
    let cancelled = false;

    fetch("/api/settings")
      .then((r) => {
        if (!r.ok) throw new Error("Settings unavailable");
        return r.json();
      })
      .then((d) => {
        if (cancelled || !d.settings) return;

        setSettings({
          shippingFee: d.settings.shippingFee ?? 250,
          freeShippingThreshold: d.settings.freeShippingThreshold ?? 5000,
          enableFreeShipping: d.settings.enableFreeShipping ?? true,
        });
      })
      .catch((err) => console.error("Settings fetch error:", err));

    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch coins
  useEffect(() => {
    if (!form.email || !form.email.includes("@")) {
      setTotalCoins(0);
      setEarnedCoins(0);
      setReferralCoins(0);
      setUseCoins(false);
      return;
    }

    let cancelled = false;

    const timer = setTimeout(async () => {
      setCheckingCoins(true);

      try {
        const res = await fetch(
          `/api/customer/check-coins?email=${encodeURIComponent(form.email.trim())}`
        );

        const data = await res.json();

        if (cancelled) return;

        if (res.ok) {
          setTotalCoins(data.totalCoins || 0);
          setEarnedCoins(data.earnedCoins || 0);
          setReferralCoins(data.referralCoins || 0);
        } else {
          setTotalCoins(0);
          setEarnedCoins(0);
          setReferralCoins(0);
        }
      } catch {
        if (!cancelled) {
          setTotalCoins(0);
          setEarnedCoins(0);
          setReferralCoins(0);
        }
      } finally {
        if (!cancelled) setCheckingCoins(false);
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [form.email]);

  const shipping =
    settings.enableFreeShipping &&
    totalPrice >= settings.freeShippingThreshold
      ? 0
      : settings.shippingFee;

  const totalBeforeCoins = totalPrice + shipping;

  const coinsToUse = useCoins
    ? Math.min(totalCoins, totalBeforeCoins)
    : 0;

  const grandTotal = Math.max(0, totalBeforeCoins - coinsToUse);

  // Place order
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0 || orderRequestRef.current) return;

    orderRequestRef.current = true;
    setPlacing(true);
    setError("");

    try {
      const orderItems = items.map((item) => ({
        productId: item.id,
        name: item.name,
        price: item.salePrice || item.price,
        quantity: item.quantity,
        image: item.image,
      }));

      const res = await fetch("/api/orders", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName: form.name.trim(),
          customerPhone: form.phone.trim(),
          customerEmail: form.email.trim(),
          customerAddress: form.address.trim(),
          notes: form.notes.trim(),
          items: orderItems,
          coinsUsed: coinsToUse,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to place order.");
      }

      if (!data?.order?.orderNumber) {
        throw new Error(
          "Order details were not returned. Please contact support before placing another order."
        );
      }

      localStorage.setItem(
        "ss-customer",
        JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
        })
      );

      setOrderSnapshot({
        items: [...items],
        subtotal: totalPrice,
        shipping,
        coinsUsed: coinsToUse,
        total: grandTotal,
      });

      setOrderId(data.order.orderNumber);
      setShowSuccess(true);

      await loadOrderHistory();
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setPlacing(false);
      orderRequestRef.current = false;
    }
  };

  // Open review form
  const openReview = (order: CustomerOrder, product: OrderItem) => {
    setReviewOrder(order);
    setReviewProduct(product);
    setReviewRating(5);
    setReviewComment("");
    setReviewError("");
    setReviewMessage("");
  };

  // Submit review using HTTP-only history cookie
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reviewOrder || !reviewProduct) {
      setReviewError("Please select an order and product.");
      return;
    }

    if (!reviewComment.trim()) {
      setReviewError("Please write your review.");
      return;
    }

    if (reviewComment.trim().length > 1500) {
      setReviewError("Review cannot exceed 1500 characters.");
      return;
    }

    setSubmittingReview(true);
    setReviewError("");
    setReviewMessage("");

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: reviewOrder.id,
          productId: reviewProduct.productId,
          rating: reviewRating,
          comment: reviewComment.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Review submission failed.");
      }

      setReviewMessage(
        "Your review has been submitted and is awaiting admin approval."
      );

      await loadOrderHistory();
    } catch (err: any) {
      setReviewError(err.message || "Unable to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  // Close review modal
  const closeReview = () => {
    if (submittingReview) return;

    setReviewProduct(null);
    setReviewOrder(null);
    setReviewMessage("");
    setReviewError("");
  };

  // Open return request form with order customer details
  const openReturnForm = (order: CustomerOrder) => {
    setReturnOrder(order);
    setReturnReason("");
    setReturnDetails("");
    setReturnImages([]);
    setReturnVideos([]);
    setReturnError("");
    setReturnMessage("");

    setReturnCustomer({
      phone: order.customerPhone || "",
      email: order.customerEmail || "",
      address: order.customerAddress || "",
    });
  };

  // Upload one file using existing upload API
  const uploadReturnFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      credentials: "same-origin",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok || !data.url) {
      throw new Error(data.error || `Unable to upload ${file.name}`);
    }

    return data.url;
  };

  // Submit return request
  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!returnOrder || submittingReturn) return;

    if (!returnCustomer.phone.trim()) {
      setReturnError("Please enter your phone number.");
      return;
    }

    if (!returnCustomer.address.trim()) {
      setReturnError("Please enter your delivery address.");
      return;
    }

    if (
      returnCustomer.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(returnCustomer.email.trim())
    ) {
      setReturnError("Please enter a valid email address.");
      return;
    }

    if (!returnReason.trim()) {
      setReturnError("Please select a return reason.");
      return;
    }

    if (returnImages.length > 5) {
      setReturnError("You can upload a maximum of 5 images.");
      return;
    }

    if (returnVideos.length > 2) {
      setReturnError("You can upload a maximum of 2 videos.");
      return;
    }

    for (const file of returnImages) {
      if (
        !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
          file.type
        )
      ) {
        setReturnError("Images must be JPG, PNG, WEBP or GIF.");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setReturnError(`${file.name} exceeds the 5 MB image limit.`);
        return;
      }
    }

    for (const file of returnVideos) {
      if (
        !["video/mp4", "video/webm", "video/quicktime"].includes(file.type)
      ) {
        setReturnError("Videos must be MP4, WEBM or MOV.");
        return;
      }

      if (file.size > 50 * 1024 * 1024) {
        setReturnError(`${file.name} exceeds the 50 MB video limit.`);
        return;
      }
    }

    setSubmittingReturn(true);
    setReturnError("");
    setReturnMessage("");

    try {
      // Upload images
      const imageUrls: string[] = [];

      for (const file of returnImages) {
        imageUrls.push(await uploadReturnFile(file));
      }

      // Upload videos
      const videoUrls: string[] = [];

      for (const file of returnVideos) {
        videoUrls.push(await uploadReturnFile(file));
      }

      // Send uploaded URLs and customer details to return API
      const requestData = new FormData();

      requestData.append("orderId", returnOrder.id);
      requestData.append("reason", returnReason.trim());
      requestData.append("details", returnDetails.trim());

      requestData.append("customerPhone", returnCustomer.phone.trim());
      requestData.append("customerEmail", returnCustomer.email.trim());
      requestData.append("customerAddress", returnCustomer.address.trim());

      imageUrls.forEach((url) => requestData.append("images", url));
      videoUrls.forEach((url) => requestData.append("videos", url));

      const response = await fetch("/api/customer/return-requests", {
        method: "POST",
        credentials: "same-origin",
        body: requestData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Return request submission failed.");
      }

      setSubmittedReturnIds((prev) =>
        prev.includes(returnOrder.id) ? prev : [...prev, returnOrder.id]
      );

      setReturnMessage(
        "Your return request has been submitted successfully. Our team will review it."
      );
    } catch (err: any) {
      setReturnError(err.message || "Unable to submit return request.");
    } finally {
      setSubmittingReturn(false);
    }
  };

  // Close return form
  const closeReturnForm = () => {
    if (submittingReturn) return;

    setReturnOrder(null);
    setReturnReason("");
    setReturnDetails("");
    setReturnImages([]);
    setReturnVideos([]);
    setReturnError("");
    setReturnMessage("");

    setReturnCustomer({
      phone: "",
      email: "",
      address: "",
    });
  };

  // Close success popup
  const handleCloseSuccess = () => {
    setShowSuccess(false);
    clearCart();

    setForm({
      name: "",
      phone: "",
      email: "",
      address: "",
      notes: "",
    });

    setUseCoins(false);
    setTotalCoins(0);
    setEarnedCoins(0);
    setReferralCoins(0);

    router.push("/");
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    border: "1px solid var(--border-strong)",
    borderRadius: "8px",
    background: "var(--surface)",
    color: "var(--text-primary)",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    marginBottom: "16px",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "13px",
    fontWeight: 600,
    color: "var(--text-primary)",
    marginBottom: "7px",
  };

  const cardStyle: React.CSSProperties = {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 3px 14px rgba(0,0,0,0.035)",
  };

  const statusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: "Pending",
      CONFIRMED: "Confirmed",
      PROCESSING: "Processing",
      SHIPPED: "Shipped",
      DELIVERED: "Delivered",
      CANCELLED: "Cancelled",
    };

    return labels[status] || status;
  };

  return (
    <div className="cart-page">
      <div className="cart-container">
        <Link href="/" className="back-link">
          <ArrowLeft size={16} />
          Continue Shopping
        </Link>

        <div className="page-heading">
          <div className="heading-icon">
            <ShoppingCart size={23} />
          </div>

          <div>
            <h1>My Cart</h1>
            <p>
              {totalItems} {totalItems === 1 ? "item" : "items"} in your cart
            </p>
          </div>
        </div>

        {/* CUSTOMER ORDER HISTORY */}
        <section className="history-card" style={cardStyle}>
          <div className="history-heading">
            <div className="history-title">
              <Package size={21} />
              <div>
                <h2>My Orders</h2>
                <p>View your orders, return products and review purchases.</p>
              </div>
            </div>

            <button
              type="button"
              className="history-toggle"
              onClick={() => {
                const next = !showOrders;
                setShowOrders(next);
                if (next) loadOrderHistory();
              }}
            >
              {showOrders ? "Hide Orders" : "Order History"}
            </button>
          </div>

          {showOrders && (
            <div className="history-content">
              {loadingOrders ? (
                <div className="history-state">
                  <RefreshCw size={20} className="spin" />
                  Loading your orders...
                </div>
              ) : ordersError ? (
                <div className="history-error">
                  {ordersError}
                  <button type="button" onClick={loadOrderHistory}>
                    Try Again
                  </button>
                </div>
              ) : orders.length === 0 ? (
                <div className="history-state">
                  <Package size={27} />
                  <strong>No orders found</strong>
                  <span>Your placed orders will appear here.</span>
                </div>
              ) : (
                <div className="orders-list">
                  {orders.map((order) => {
                    const returnSubmitted = submittedReturnIds.includes(order.id);

                    return (
                      <article className="order-card" key={order.id}>
                        <div className="order-top">
                          <div>
                            <span className="order-caption">ORDER NUMBER</span>
                            <strong>{order.orderNumber}</strong>
                            <small>
                              {new Date(order.createdAt).toLocaleDateString()}
                            </small>
                          </div>

                          <span
                            className={`order-status ${order.status.toLowerCase()}`}
                          >
                            <Clock size={13} />
                            {statusLabel(order.status)}
                          </span>
                        </div>

                        <div className="history-products">
                          {order.items.map((product) => {
                            const existingReview = order.reviews?.find(
                              (review) =>
                                review.productId === product.productId
                            );

                            return (
                              <div className="history-product" key={product.id}>
                                <img
                                  src={product.image || "/placeholder.png"}
                                  alt={product.name}
                                />

                                <div className="history-product-info">
                                  <strong>{product.name}</strong>
                                  <span>
                                    Qty: {product.quantity} · Rs.{" "}
                                    {Number(product.price).toLocaleString()}
                                  </span>
                                </div>

                                {existingReview ? (
                                  <span className="review-submitted">
                                    <CheckCircle2 size={14} />
                                    {existingReview.status === "APPROVED"
                                      ? "Reviewed"
                                      : existingReview.status === "REJECTED"
                                        ? "Review Rejected"
                                        : "Review Pending"}
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    className="review-button"
                                    onClick={() => openReview(order, product)}
                                  >
                                    <Star size={14} />
                                    Review
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        <div className="order-bottom">
                          <span>Order Total</span>
                          <strong>
                            Rs. {Number(order.total).toLocaleString()}
                          </strong>
                        </div>

                        <div className="return-action">
                          {returnSubmitted ? (
                            <span className="return-submitted">
                              <CheckCircle2 size={15} />
                              Return Request Submitted
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="return-button"
                              onClick={() => openReturnForm(order)}
                            >
                              <RotateCcw size={15} />
                              Return Order
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>

        {items.length === 0 && !showSuccess ? (
          <div className="empty-cart" style={cardStyle}>
            <div className="empty-icon">
              <ShoppingCart size={42} />
            </div>

            <h2>Your cart is empty</h2>
            <p>Looks like you haven't added anything to your cart yet.</p>

            <Link href="/" className="primary-button">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="cart-layout">
            <div className="cart-main">
              <section style={cardStyle}>
                <div className="section-heading">
                  <h2>Shopping Cart</h2>
                  <span>{totalItems} items</span>
                </div>

                <div className="cart-items">
                  {items.map((item) => {
                    const price = item.salePrice || item.price;
                    const lineTotal = price * item.quantity;

                    return (
                      <div className="cart-item" key={item.id}>
                        <img
                          src={item.image}
                          alt={item.name}
                          className="product-image"
                        />

                        <div className="product-details">
                          <h3>{item.name}</h3>

                          <div className="product-price">
                            Rs. {price.toLocaleString()}
                          </div>

                          {item.salePrice && (
                            <span className="old-price">
                              Rs. {item.price.toLocaleString()}
                            </span>
                          )}

                          <div className="mobile-quantity">
                            <div className="quantity-control">
                              <button
                                type="button"
                                aria-label="Decrease quantity"
                                onClick={() =>
                                  updateQuantity(item.id, item.quantity - 1)
                                }
                              >
                                <Minus size={14} />
                              </button>

                              <span>{item.quantity}</span>

                              <button
                                type="button"
                                aria-label="Increase quantity"
                                onClick={() =>
                                  updateQuantity(item.id, item.quantity + 1)
                                }
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="item-actions">
                          <div className="quantity-control desktop-quantity">
                            <button
                              type="button"
                              aria-label="Decrease quantity"
                              onClick={() =>
                                updateQuantity(item.id, item.quantity - 1)
                              }
                            >
                              <Minus size={14} />
                            </button>

                            <span>{item.quantity}</span>

                            <button
                              type="button"
                              aria-label="Increase quantity"
                              onClick={() =>
                                updateQuantity(item.id, item.quantity + 1)
                              }
                            >
                              <Plus size={14} />
                            </button>
                          </div>

                          <strong className="line-total">
                            Rs. {lineTotal.toLocaleString()}
                          </strong>

                          <button
                            type="button"
                            className="remove-button"
                            aria-label="Remove item"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* DELIVERY DETAILS */}
              <form
                onSubmit={handlePlaceOrder}
                style={cardStyle}
                className="delivery-card"
              >
                <div className="section-heading">
                  <div>
                    <h2>Delivery Details</h2>
                    <p className="section-subtitle">
                      Enter your information to complete your order.
                    </p>
                  </div>
                  <Truck size={22} className="heading-muted-icon" />
                </div>

                <label style={labelStyle}>Full Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  placeholder="Ali Khan"
                  className="checkout-input"
                  style={inputStyle}
                />

                <label style={labelStyle}>Phone Number</label>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) =>
                    setForm({ ...form, phone: e.target.value })
                  }
                  placeholder="+92 300 1234567"
                  className="checkout-input"
                  style={inputStyle}
                />

                <label style={labelStyle}>Email Address</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                  placeholder="you@example.com"
                  className="checkout-input"
                  style={inputStyle}
                />

                {checkingCoins && (
                  <p className="checking-coins">
                    Checking your available coins...
                  </p>
                )}

                <label style={labelStyle}>Delivery Address</label>
                <textarea
                  required
                  rows={3}
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                  placeholder="House number, street, area, city"
                  className="checkout-input"
                  style={{
                    ...inputStyle,
                    resize: "vertical",
                    minHeight: "90px",
                  }}
                />

                <div className="payment-method">
                  <div className="payment-icon">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <strong>Cash on Delivery</strong>
                    <p>Pay when your order arrives.</p>
                  </div>
                </div>

                {error && <div className="error-message">{error}</div>}

                <button
                  type="submit"
                  disabled={placing || items.length === 0}
                  className="place-order-button"
                >
                  {placing
                    ? "Placing Your Order..."
                    : `Place Order — Rs. ${grandTotal.toLocaleString()}`}
                </button>

                <p className="secure-note">
                  <ShieldCheck size={14} />
                  Your order details are securely processed.
                </p>
              </form>
            </div>

            {/* ORDER SUMMARY */}
            <aside className="summary-column">
              <div style={cardStyle} className="summary-card">
                <h2>Order Summary</h2>

                <div className="summary-row">
                  <span>Subtotal</span>
                  <strong>Rs. {totalPrice.toLocaleString()}</strong>
                </div>

                <div className="summary-row">
                  <span>Shipping</span>
                  <strong>
                    {shipping === 0 ? (
                      <span className="free-label">FREE</span>
                    ) : (
                      `Rs. ${shipping.toLocaleString()}`
                    )}
                  </strong>
                </div>

                {settings.enableFreeShipping && shipping > 0 && (
                  <div className="free-shipping-note">
                    Add Rs.{" "}
                    {(
                      settings.freeShippingThreshold - totalPrice
                    ).toLocaleString()}{" "}
                    more to get free shipping.
                  </div>
                )}

                {(earnedCoins > 0 || referralCoins > 0) && (
                  <div className="coin-info-grid">
                    {earnedCoins > 0 && (
                      <div className="coin-box earned">
                        <span>
                          <Coins size={13} /> Earned Coins
                        </span>
                        <strong>Rs. {earnedCoins.toFixed(0)}</strong>
                      </div>
                    )}

                    {referralCoins > 0 && (
                      <div className="coin-box referral">
                        <span>
                          <Gift size={13} /> Referral Coins
                        </span>
                        <strong>Rs. {referralCoins.toFixed(0)}</strong>
                      </div>
                    )}
                  </div>
                )}

                {totalCoins > 0 && (
                  <div className="use-coins-box">
                    <label>
                      <input
                        type="checkbox"
                        checked={useCoins}
                        onChange={(e) => setUseCoins(e.target.checked)}
                      />

                      <span>
                        <strong>Use Your Coins</strong>
                        <small>
                          Available: Rs. {totalCoins.toLocaleString()}
                        </small>
                      </span>
                    </label>
                  </div>
                )}

                {useCoins && (
                  <div className="summary-row discount-row">
                    <span>Coins Discount</span>
                    <strong>
                      - Rs. {coinsToUse.toLocaleString()}
                    </strong>
                  </div>
                )}

                <div className="summary-total">
                  <span>Total</span>
                  <strong>Rs. {grandTotal.toLocaleString()}</strong>
                </div>

                <div className="summary-footer">
                  <ShieldCheck size={16} />
                  Safe and secure checkout
                </div>
              </div>

              <div className="benefit-card">
                <div>
                  <Truck size={20} />
                  <span>
                    <strong>Reliable Delivery</strong>
                    <small>Delivered to your doorstep</small>
                  </span>
                </div>

                <div>
                  <ShieldCheck size={20} />
                  <span>
                    <strong>Cash on Delivery</strong>
                    <small>Pay when you receive your order</small>
                  </span>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>

      {/* RETURN REQUEST MODAL */}
      {returnOrder && (
        <div className="success-overlay">
          <form className="return-modal" onSubmit={handleReturnSubmit}>
            <button
              type="button"
              className="modal-close"
              onClick={closeReturnForm}
              disabled={submittingReturn}
              aria-label="Close return form"
            >
              <X size={19} />
            </button>

            <div className="return-modal-icon">
              <RotateCcw size={25} />
            </div>

            <h2>Return Request</h2>

            <p className="return-order-number">
              Order: {returnOrder.orderNumber}
            </p>

            {returnMessage ? (
              <div className="return-success">
                <CheckCircle2 size={35} />
                <strong>Request Submitted!</strong>
                <p>{returnMessage}</p>

                <button
                  type="button"
                  className="place-order-button"
                  onClick={closeReturnForm}
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                {/* CUSTOMER PHONE */}
                <label style={labelStyle}>Phone Number *</label>

                <input
                  type="tel"
                  required
                  maxLength={30}
                  value={returnCustomer.phone}
                  onChange={(e) =>
                    setReturnCustomer((prev) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
                  }
                  placeholder="Enter phone number"
                  className="checkout-input"
                  style={inputStyle}
                  disabled={submittingReturn}
                />

                {/* CUSTOMER EMAIL */}
                <label style={labelStyle}>Email Address</label>

                <input
                  type="email"
                  maxLength={254}
                  value={returnCustomer.email}
                  onChange={(e) =>
                    setReturnCustomer((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  placeholder="Enter email address"
                  className="checkout-input"
                  style={inputStyle}
                  disabled={submittingReturn}
                />

                {/* CUSTOMER ADDRESS */}
                <label style={labelStyle}>Delivery Address *</label>

                <textarea
                  required
                  maxLength={1000}
                  rows={3}
                  value={returnCustomer.address}
                  onChange={(e) =>
                    setReturnCustomer((prev) => ({
                      ...prev,
                      address: e.target.value,
                    }))
                  }
                  placeholder="Enter your complete address"
                  className="checkout-input"
                  style={{
                    ...inputStyle,
                    resize: "vertical",
                    minHeight: "80px",
                  }}
                  disabled={submittingReturn}
                />

                {/* RETURN REASON */}
                <label style={labelStyle}>Reason for Return *</label>

                <select
                  required
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="checkout-input"
                  style={inputStyle}
                  disabled={submittingReturn}
                >
                  <option value="">Select return reason</option>
                  <option value="Damaged Product">Damaged Product</option>
                  <option value="Wrong Product Received">Wrong Product Received</option>
                  <option value="Defective Product">Defective Product</option>
                  <option value="Missing Items">Missing Items</option>
                  <option value="Product Not as Described">Product Not as Described</option>
                  <option value="Other">Other</option>
                </select>

                {/* ADDITIONAL DETAILS */}
                <label style={labelStyle}>Additional Details (Optional)</label>

                <textarea
                  rows={4}
                  value={returnDetails}
                  onChange={(e) => setReturnDetails(e.target.value)}
                  placeholder="Explain the reason for your return..."
                  className="checkout-input"
                  style={{
                    ...inputStyle,
                    resize: "vertical",
                    minHeight: "90px",
                  }}
                  disabled={submittingReturn}
                />

                {/* IMAGE UPLOAD */}
                <label style={labelStyle}>
                  <ImageIcon
                    size={15}
                    style={{ display: "inline", marginRight: 5 }}
                  />
                  Upload Images (Max 5, 5 MB each)
                </label>

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  disabled={submittingReturn}
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setReturnImages(files.slice(0, 5));
                    setReturnError("");
                    e.target.value = "";
                  }}
                  className="file-input"
                />

                {returnImages.length > 0 && (
                  <div className="selected-files">
                    {returnImages.map((file, index) => (
                      <div key={`${file.name}-${index}`}>
                        <ImageIcon size={13} />
                        <span>{file.name}</span>
                        <button
                          type="button"
                          disabled={submittingReturn}
                          onClick={() =>
                            setReturnImages((prev) =>
                              prev.filter((_, i) => i !== index)
                            )
                          }
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* VIDEO UPLOAD */}
                <label style={labelStyle}>
                  <Video
                    size={15}
                    style={{ display: "inline", marginRight: 5 }}
                  />
                  Upload Videos (Max 2, 50 MB each)
                </label>

                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  multiple
                  disabled={submittingReturn}
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setReturnVideos(files.slice(0, 2));
                    setReturnError("");
                    e.target.value = "";
                  }}
                  className="file-input"
                />

                {returnVideos.length > 0 && (
                  <div className="selected-files">
                    {returnVideos.map((file, index) => (
                      <div key={`${file.name}-${index}`}>
                        <Video size={13} />
                        <span>{file.name}</span>
                        <button
                          type="button"
                          disabled={submittingReturn}
                          onClick={() =>
                            setReturnVideos((prev) =>
                              prev.filter((_, i) => i !== index)
                            )
                          }
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <p className="return-upload-note">
                  You can submit images, videos, both, or neither.
                </p>

                {returnError && (
                  <div className="error-message">{returnError}</div>
                )}

                <button
                  type="submit"
                  className="place-order-button"
                  disabled={submittingReturn}
                >
                  {submittingReturn ? (
                    <>
                      <RefreshCw size={16} className="spin" />
                      Uploading and Submitting...
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      Submit Return Request
                    </>
                  )}
                </button>
              </>
            )}
          </form>
        </div>
      )}

      {/* REVIEW MODAL */}
      {reviewProduct && reviewOrder && (
        <div className="success-overlay">
          <form className="review-modal" onSubmit={handleReviewSubmit}>
            <button
              type="button"
              className="modal-close"
              onClick={closeReview}
              disabled={submittingReview}
              aria-label="Close review"
            >
              <X size={19} />
            </button>

            <div className="review-modal-icon">
              <MessageSquare size={25} />
            </div>

            <h2>Write a Review</h2>
            <p className="review-product-name">{reviewProduct.name}</p>

            <div className="rating-picker">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  type="button"
                  key={rating}
                  disabled={!!reviewMessage || submittingReview}
                  onClick={() => setReviewRating(rating)}
                  aria-label={`${rating} stars`}
                >
                  <Star
                    size={30}
                    fill={rating <= reviewRating ? "#F59E0B" : "none"}
                    color={rating <= reviewRating ? "#F59E0B" : "#D1D5DB"}
                  />
                </button>
              ))}
            </div>

            <label style={labelStyle}>Your Review</label>
            <textarea
              rows={5}
              required
              maxLength={1500}
              disabled={!!reviewMessage || submittingReview}
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Share your experience with this product..."
              className="checkout-input"
              style={{
                ...inputStyle,
                minHeight: "110px",
                resize: "vertical",
              }}
            />

            <p className="review-limit">
              {reviewComment.length}/1500 characters
            </p>

            {reviewError && (
              <div className="error-message">{reviewError}</div>
            )}

            {reviewMessage && (
              <div className="review-success">
                <CheckCircle2 size={16} />
                {reviewMessage}
              </div>
            )}

            <button
              type="submit"
              className="place-order-button"
              disabled={submittingReview || !!reviewMessage}
            >
              {submittingReview
                ? "Submitting..."
                : reviewMessage
                  ? "Review Submitted"
                  : "Submit Review"}
            </button>

            {reviewMessage && (
              <button
                type="button"
                className="review-done-button"
                onClick={closeReview}
              >
                Done
              </button>
            )}

            <p className="review-privacy">
              Your phone number and email will not appear publicly.
              Reviews are published after admin approval.
            </p>
          </form>
        </div>
      )}

      {/* ORDER SUCCESS POPUP */}
      {showSuccess && orderSnapshot && (
        <div className="success-overlay">
          <div className="success-modal">
            <button
              type="button"
              onClick={handleCloseSuccess}
              className="modal-close"
              aria-label="Close"
            >
              <X size={19} />
            </button>

            <div className="success-icon">
              <CheckCircle2 size={48} />
            </div>

            <h2>Order Placed Successfully!</h2>

            <p className="success-description">
              Thank you for shopping with us. Your order has been received.
            </p>

            <div className="order-number-box">
              <span>ORDER NUMBER</span>
              <strong>{orderId}</strong>
            </div>

            <div className="success-details">
              <div>
                <span>Subtotal</span>
                <strong>
                  Rs. {orderSnapshot.subtotal.toLocaleString()}
                </strong>
              </div>

              <div>
                <span>Shipping</span>
                <strong>
                  {orderSnapshot.shipping === 0
                    ? "FREE"
                    : `Rs. ${orderSnapshot.shipping.toLocaleString()}`}
                </strong>
              </div>

              {orderSnapshot.coinsUsed > 0 && (
                <div>
                  <span>Coins Used</span>
                  <strong>
                    - Rs. {orderSnapshot.coinsUsed.toLocaleString()}
                  </strong>
                </div>
              )}

              <div className="success-total">
                <span>Order Total</span>
                <strong>
                  Rs. {orderSnapshot.total.toLocaleString()}
                </strong>
              </div>
            </div>

            <p className="email-notice">
              Please check your email for order confirmation.
            </p>

            <button
              type="button"
              onClick={handleCloseSuccess}
              className="success-button"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .cart-page {
          min-height: 100vh;
          background: var(--bg);
          padding: 28px 18px 55px;
          color: var(--text-primary);
        }

        .cart-container {
          max-width: 1180px;
          margin: 0 auto;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: var(--text-secondary);
          font-size: 13px;
          text-decoration: none;
          margin-bottom: 25px;
        }

        .back-link:hover { color: var(--accent); }

        .page-heading {
          display: flex;
          align-items: center;
          gap: 13px;
          margin-bottom: 25px;
        }

        .heading-icon {
          width: 46px;
          height: 46px;
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent);
          background: var(--surface);
          border: 1px solid var(--border);
        }

        .page-heading h1 {
          font-size: 25px;
          font-weight: 700;
          margin: 0;
        }

        .page-heading p {
          color: var(--text-muted);
          font-size: 13px;
          margin: 4px 0 0;
        }

        .history-card { margin-bottom: 22px; }

        .history-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .history-title {
          display: flex;
          align-items: center;
          gap: 12px;
          color: var(--accent);
        }

        .history-title h2 {
          margin: 0;
          color: var(--text-primary);
          font-size: 17px;
        }

        .history-title p {
          margin: 5px 0 0;
          color: var(--text-muted);
          font-size: 12px;
        }

        .history-toggle, .review-button {
          border: none;
          border-radius: 7px;
          background: var(--accent);
          color: #fff;
          padding: 10px 14px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
        }

        .history-content {
          border-top: 1px solid var(--border);
          margin-top: 18px;
          padding-top: 16px;
        }

        .history-state {
          min-height: 110px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 9px;
          color: var(--text-muted);
          font-size: 13px;
          text-align: center;
        }

        .history-state strong { color: var(--text-primary); }

        .history-error {
          padding: 14px;
          border-radius: 8px;
          background: #fef2f2;
          color: #b91c1c;
          font-size: 13px;
        }

        .history-error button {
          margin-left: 10px;
          border: none;
          background: transparent;
          color: #991b1b;
          text-decoration: underline;
          cursor: pointer;
        }

        .orders-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .order-card {
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 15px;
        }

        .order-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          padding-bottom: 13px;
          border-bottom: 1px solid var(--border);
        }

        .order-top > div {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .order-caption {
          color: var(--text-muted);
          font-size: 9px;
          letter-spacing: 1px;
        }

        .order-top strong {
          font-size: 13px;
          color: var(--text-primary);
        }

        .order-top small {
          color: var(--text-muted);
          font-size: 11px;
        }

        .order-status {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 9px;
          border-radius: 20px;
          background: #fffbeb;
          color: #92400e;
          font-size: 10px;
          font-weight: 700;
          white-space: nowrap;
        }

        .order-status.delivered {
          background: #ecfdf5;
          color: #047857;
        }

        .order-status.cancelled {
          background: #fef2f2;
          color: #b91c1c;
        }

        .history-products {
          display: flex;
          flex-direction: column;
        }

        .history-product {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid var(--border);
        }

        .history-product img {
          width: 55px;
          height: 55px;
          object-fit: cover;
          border-radius: 7px;
          background: var(--bg-alt);
        }

        .history-product-info {
          display: flex;
          flex: 1;
          min-width: 0;
          flex-direction: column;
          gap: 5px;
        }

        .history-product-info strong {
          color: var(--text-primary);
          font-size: 12px;
        }

        .history-product-info span {
          color: var(--text-muted);
          font-size: 11px;
        }

        .review-button {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 8px 10px;
          white-space: nowrap;
        }

        .review-submitted {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #059669;
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
        }

        .order-bottom {
          display: flex;
          justify-content: space-between;
          padding-top: 13px;
          font-size: 13px;
          color: var(--text-secondary);
        }

        .order-bottom strong { color: var(--accent); }

        .return-action {
          display: flex;
          justify-content: flex-end;
          padding-top: 13px;
          margin-top: 12px;
          border-top: 1px solid var(--border);
        }

        .return-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 9px 14px;
          border: 1px solid #ef4444;
          border-radius: 7px;
          background: transparent;
          color: #ef4444;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .return-button:hover {
          background: #fef2f2;
        }

        .return-submitted {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #059669;
          font-size: 12px;
          font-weight: 700;
        }

        .cart-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.8fr) minmax(290px, 1fr);
          gap: 22px;
          align-items: start;
        }

        .cart-main {
          display: flex;
          flex-direction: column;
          gap: 20px;
          min-width: 0;
        }

        .section-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 18px;
        }

        .section-heading h2, .summary-card h2 {
          font-size: 17px;
          font-weight: 700;
          margin: 0;
        }

        .section-heading > span {
          color: var(--text-muted);
          font-size: 12px;
        }

        .section-subtitle {
          font-size: 12px;
          color: var(--text-muted);
          margin: 5px 0 0;
        }

        .heading-muted-icon { color: var(--accent); }

        .cart-items {
          display: flex;
          flex-direction: column;
        }

        .cart-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 15px 0;
          border-top: 1px solid var(--border);
        }

        .product-image {
          width: 78px;
          height: 78px;
          object-fit: cover;
          border-radius: 9px;
          background: var(--bg-alt);
          flex-shrink: 0;
        }

        .product-details {
          flex: 1;
          min-width: 0;
        }

        .product-details h3 {
          font-size: 14px;
          font-weight: 600;
          line-height: 1.5;
          margin: 0 0 7px;
        }

        .product-price {
          font-size: 14px;
          font-weight: 700;
          color: var(--accent);
        }

        .old-price {
          display: block;
          color: var(--text-muted);
          font-size: 11px;
          text-decoration: line-through;
          margin-top: 3px;
        }

        .item-actions {
          display: flex;
          align-items: center;
          gap: 13px;
        }

        .quantity-control {
          display: flex;
          align-items: center;
          border: 1px solid var(--border-strong);
          border-radius: 7px;
          overflow: hidden;
          background: var(--surface);
        }

        .quantity-control button {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          cursor: pointer;
        }

        .quantity-control button:hover { background: var(--bg-alt); }

        .quantity-control span {
          min-width: 25px;
          text-align: center;
          font-size: 13px;
        }

        .line-total {
          font-size: 13px;
          min-width: 90px;
          text-align: right;
        }

        .remove-button {
          border: none;
          background: transparent;
          color: #ef4444;
          padding: 7px;
          cursor: pointer;
          border-radius: 6px;
        }

        .remove-button:hover { background: #fef2f2; }
        .mobile-quantity { display: none; }

        .checkout-input { transition: border-color 0.2s, box-shadow 0.2s; }

        .checkout-input:focus {
          border-color: var(--accent) !important;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.08);
        }

        .checking-coins {
          color: var(--text-muted);
          font-size: 11px;
          margin: -9px 0 12px;
        }

        .payment-method {
          display: flex;
          align-items: center;
          gap: 12px;
          background: var(--bg-alt);
          border: 1px solid var(--border);
          border-radius: 9px;
          padding: 13px;
          margin: 2px 0 18px;
        }

        .payment-icon {
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--surface);
          color: var(--accent);
          border-radius: 8px;
        }

        .payment-method strong { display: block; font-size: 13px; }
        .payment-method p {
          color: var(--text-muted);
          font-size: 11px;
          margin: 4px 0 0;
        }

        .place-order-button, .success-button {
          width: 100%;
          border: none;
          border-radius: 8px;
          padding: 14px;
          color: white;
          background: var(--accent);
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.2s;
        }

        .place-order-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .place-order-button:hover, .success-button:hover { opacity: 0.9; }
        .place-order-button:disabled { opacity: 0.6; cursor: not-allowed; }

        .secure-note {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          color: var(--text-muted);
          font-size: 11px;
          margin: 12px 0 0;
        }

        .error-message {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
          padding: 11px;
          border-radius: 7px;
          font-size: 12px;
          margin-bottom: 13px;
        }

        .summary-column {
          display: flex;
          flex-direction: column;
          gap: 15px;
          position: sticky;
          top: 20px;
        }

        .summary-card h2 { margin-bottom: 21px; }

        .summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          margin-bottom: 15px;
        }

        .summary-row > span { color: var(--text-secondary); }
        .summary-row strong { font-weight: 600; }
        .free-label { color: #059669; }

        .free-shipping-note {
          font-size: 11px;
          line-height: 1.5;
          color: var(--text-muted);
          background: var(--bg-alt);
          border-radius: 7px;
          padding: 10px;
          margin-bottom: 15px;
        }

        .coin-info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin: 15px 0;
        }

        .coin-box { padding: 10px; border-radius: 8px; }
        .coin-box span {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          font-weight: 600;
        }

        .coin-box strong { display: block; font-size: 13px; margin-top: 5px; }
        .earned { background: #f0fdf4; color: #047857; }
        .referral { background: #eff6ff; color: #1d4ed8; }

        .use-coins-box {
          padding: 12px;
          border: 1px solid #fde68a;
          background: #fffbeb;
          border-radius: 8px;
          margin: 15px 0;
        }

        .use-coins-box label {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
        }

        .use-coins-box input {
          width: 16px;
          height: 16px;
          accent-color: #d97706;
        }

        .use-coins-box strong, .use-coins-box small { display: block; }
        .use-coins-box strong { font-size: 12px; color: #92400e; }
        .use-coins-box small { color: #b45309; font-size: 11px; margin-top: 3px; }
        .discount-row, .discount-row strong { color: #059669; }

        .summary-total {
          border-top: 1px solid var(--border);
          padding-top: 17px;
          margin-top: 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 15px;
          font-weight: 700;
        }

        .summary-total strong { color: var(--accent); font-size: 19px; }

        .summary-footer {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 6px;
          border-top: 1px solid var(--border);
          margin-top: 18px;
          padding-top: 14px;
          color: var(--text-muted);
          font-size: 11px;
        }

        .benefit-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 15px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .benefit-card > div {
          display: flex;
          align-items: center;
          gap: 11px;
          color: var(--accent);
        }

        .benefit-card strong, .benefit-card small { display: block; }
        .benefit-card strong { color: var(--text-primary); font-size: 12px; }
        .benefit-card small { color: var(--text-muted); font-size: 11px; margin-top: 3px; }

        .empty-cart { text-align: center; padding: 55px 20px !important; }
        .empty-icon { color: var(--text-muted); margin-bottom: 15px; }
        .empty-cart h2 { font-size: 19px; margin: 0 0 8px; }
        .empty-cart p { font-size: 13px; color: var(--text-muted); margin: 0 0 20px; }

        .primary-button {
          display: inline-block;
          background: var(--accent);
          color: white;
          text-decoration: none;
          border-radius: 8px;
          padding: 12px 22px;
          font-size: 13px;
          font-weight: 600;
        }

        .success-overlay {
          position: fixed;
          inset: 0;
          z-index: 200;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          background: rgba(15, 23, 42, 0.58);
          backdrop-filter: blur(4px);
        }

        .success-modal, .review-modal, .return-modal {
          position: relative;
          width: 100%;
          max-width: 440px;
          max-height: 90vh;
          overflow-y: auto;
          background: white;
          color: #111827;
          border-radius: 16px;
          padding: 30px;
          box-shadow: 0 20px 70px rgba(0, 0, 0, 0.2);
          text-align: center;
        }

        .review-modal, .return-modal { text-align: left; }
        .return-modal { max-width: 500px; }

        .modal-close {
          position: absolute;
          top: 14px;
          right: 14px;
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          border-radius: 50%;
          background: #f3f4f6;
          cursor: pointer;
          color: #4b5563;
        }

        .modal-close:disabled { opacity: 0.5; cursor: not-allowed; }

        .success-icon {
          width: 76px;
          height: 76px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #ecfdf5;
          color: #059669;
          margin: 0 auto 17px;
        }

        .success-modal h2, .review-modal h2, .return-modal h2 {
          font-size: 21px;
          font-weight: 700;
          margin: 0 0 9px;
        }

        .success-description {
          color: #6b7280;
          font-size: 13px;
          line-height: 1.6;
          margin: 0 0 20px;
        }

        .order-number-box {
          padding: 13px;
          border-radius: 9px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          margin-bottom: 18px;
        }

        .order-number-box span {
          display: block;
          color: #9ca3af;
          font-size: 10px;
          letter-spacing: 1px;
          margin-bottom: 5px;
        }

        .order-number-box strong { color: #111827; font-size: 17px; }

        .success-details { text-align: left; padding: 0 2px; }
        .success-details > div {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          font-size: 13px;
          margin-bottom: 12px;
          color: #6b7280;
        }

        .success-details strong { color: #111827; }

        .success-details .success-total {
          border-top: 1px solid #e5e7eb;
          padding-top: 15px;
          margin-top: 15px;
          color: #111827;
          font-weight: 700;
          font-size: 15px;
        }

        .success-total strong { color: #2563eb; font-size: 17px; }

        .email-notice {
          background: #eff6ff;
          color: #1d4ed8;
          border-radius: 8px;
          padding: 11px;
          font-size: 12px;
          margin: 18px 0;
        }

        .success-button { background: #111827; padding: 13px; }

        .review-modal-icon, .return-modal-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #eff6ff;
          color: #2563eb;
          border-radius: 12px;
          margin-bottom: 15px;
        }

        .return-modal-icon {
          background: #fef2f2;
          color: #ef4444;
        }

        .review-product-name, .return-order-number {
          color: #6b7280;
          font-size: 13px;
          margin: 0 0 15px;
        }

        .rating-picker {
          display: flex;
          gap: 7px;
          margin: 12px 0 20px;
        }

        .rating-picker button {
          padding: 2px;
          border: none;
          background: transparent;
          cursor: pointer;
        }

        .rating-picker button:disabled {
          cursor: not-allowed;
          opacity: 0.7;
        }

        .review-limit {
          color: #9ca3af;
          font-size: 10px;
          text-align: right;
          margin: -10px 0 15px;
        }

        .review-success {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 10px;
          border-radius: 7px;
          background: #ecfdf5;
          color: #047857;
          font-size: 12px;
          margin-bottom: 12px;
        }

        .review-done-button {
          width: 100%;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 12px;
          margin-top: 10px;
          background: #f9fafb;
          color: #111827;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        .review-privacy {
          color: #6b7280;
          font-size: 11px;
          line-height: 1.5;
          text-align: center;
          margin: 13px 0 0;
        }

        .file-input {
          display: block;
          width: 100%;
          box-sizing: border-box;
          border: 1px dashed #cbd5e1;
          border-radius: 8px;
          padding: 11px;
          margin-bottom: 15px;
          background: #f8fafc;
          color: #475569;
          font-size: 12px;
        }

        .selected-files {
          display: flex;
          flex-direction: column;
          gap: 7px;
          margin: -7px 0 15px;
        }

        .selected-files > div {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 8px 10px;
          background: #f1f5f9;
          border-radius: 7px;
          color: #334155;
          font-size: 11px;
        }

        .selected-files span {
          flex: 1;
          overflow-wrap: anywhere;
        }

        .selected-files button {
          border: none;
          background: transparent;
          color: #dc2626;
          cursor: pointer;
          display: flex;
        }

        .return-upload-note {
          color: #64748b;
          font-size: 11px;
          margin: 0 0 15px;
        }

        .return-success {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 20px 0 0;
          color: #059669;
          text-align: center;
        }

        .return-success strong {
          color: #111827;
          font-size: 17px;
        }

        .return-success p {
          color: #64748b;
          font-size: 13px;
          line-height: 1.6;
          margin: 0 0 10px;
        }

        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 900px) {
          .cart-layout { grid-template-columns: 1fr; }
          .summary-column { position: static; }
        }

        @media (max-width: 600px) {
          .cart-page { padding: 18px 12px 35px; }
          .page-heading h1 { font-size: 21px; }
          .history-heading { align-items: flex-start; flex-direction: column; }
          .history-toggle { width: 100%; }
          .order-top { flex-direction: column; }
          .history-product { gap: 8px; }
          .history-product img { width: 46px; height: 46px; }
          .history-product-info strong { font-size: 11px; }
          .review-button { padding: 7px; font-size: 10px; }
          .review-submitted { font-size: 9px; }
          .cart-item { gap: 10px; align-items: flex-start; }
          .product-image { width: 68px; height: 68px; }
          .product-details h3 { font-size: 12px; }
          .item-actions { flex-direction: column; align-items: flex-end; gap: 7px; }
          .desktop-quantity { display: none; }
          .mobile-quantity { display: block; margin-top: 9px; }
          .line-total { font-size: 12px; min-width: 0; }
          .remove-button { padding: 4px; }
          .success-modal, .review-modal, .return-modal { padding: 27px 20px; }
        }
      `}</style>
    </div>
  );
}
