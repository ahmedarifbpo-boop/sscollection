
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Shirt,
  Smartphone,
  Gem,
  Home as HomeIcon,
  Sparkles,
  Dumbbell,
  ShoppingBasket,
  Baby,
  Star,
  ShoppingCart,
  ShieldCheck,
  RefreshCcw,
  FileText,
  ChevronRight,
} from "lucide-react";
import { useCart } from "@/lib/cart";
import { useChat } from "@/lib/chat";

const iconMap: Record<string, any> = {
  Shirt,
  Smartphone,
  Gem,
  Home: HomeIcon,
  Sparkles,
  Dumbbell,
  ShoppingBasket,
  Baby,
};

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  salePrice: number | null;
  stock: number;
  image: string;
  images?: string[];
  video?: string | null;
  rating: number;
  reviews: number;
  createdAt?: string;
}

interface Category {
  id: string;
  name: string;
  icon: string | null;
}

interface Offer {
  id: string;
  title: string;
  subtitle: string | null;
  image: string;
  ctaText: string;
  ctaLink: string;
}

export default function HomeClient({
  initialProducts,
  initialCategories,
  initialOffers,
}: {
  initialProducts: Product[];
  initialCategories: Category[];
  initialOffers: Offer[];
}) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [products, setProducts] = useState<Product[]>(initialProducts);

  // Shared chat opener
  const { openChat } = useChat();

  // Automatically refresh products every 5 seconds
  useEffect(() => {
    let isMounted = true;

    const fetchLatestProducts = async () => {
      try {
        const response = await fetch("/api/products", {
          cache: "no-store",
        });

        if (!response.ok) return;

        const data = await response.json();

        if (isMounted && Array.isArray(data.products)) {
          setProducts(data.products);
        }
      } catch (error) {
        console.error("Products refresh error:", error);
      }
    };

    fetchLatestProducts();

    const interval = setInterval(fetchLatestProducts, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // API already returns newest products first.
  const newArrivals = products.slice(0, 8);
  const justForYou = products.slice(8);

  const filteredJustForYou =
    activeCategory === "All"
      ? justForYou
      : justForYou.filter((product) => product.category === activeCategory);

  const filteredNewArrivals =
    activeCategory === "All"
      ? newArrivals
      : newArrivals.filter((product) => product.category === activeCategory);

  return (
    <div className="home-page">
      {/* CATEGORY NAVIGATION */}

      <div className="home-category-strip">
        <button
          onClick={() => setActiveCategory("All")}
          className={activeCategory === "All" ? "home-category-active" : ""}
        >
          All
        </button>

        {initialCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.name)}
            className={
              activeCategory === cat.name ? "home-category-active" : ""
            }
          >
            {cat.name}
          </button>
        ))}
      </div>

      <main className="home-container">
        {/* HERO BANNER */}

        <HeroSlider offers={initialOffers} />

        {/* NEW ARRIVALS */}

        <section className="home-section new-arrivals-section">
          <div className="home-section-heading">
            <div>
              <span className="section-eyebrow">JUST LANDED</span>
              <h2>New Arrivals</h2>
              <p>Discover our latest additions</p>
            </div>

            <span className="section-count">
              {filteredNewArrivals.length} items
            </span>
          </div>

          {filteredNewArrivals.length === 0 ? (
            <div className="home-empty">
              No new arrivals available.
            </div>
          ) : (
            <div className="new-arrivals-track">
              {filteredNewArrivals.map((product) => (
                <div className="new-arrival-card" key={product.id}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* SHOP BY CATEGORY */}

        <section className="home-section">
          <div className="home-section-heading centered-heading">
            <div>
              <span className="section-eyebrow">EXPLORE OUR COLLECTION</span>
              <h2>Shop by Category</h2>
              <p>Find exactly what you are looking for</p>
            </div>
          </div>

          <div className="home-category-grid">
            {initialCategories.map((cat) => {
              const Icon = cat.icon ? iconMap[cat.icon] : null;

              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.name)}
                  className={`home-category-card ${
                    activeCategory === cat.name ? "selected" : ""
                  }`}
                >
                  <div className="home-category-icon">
                    {Icon ? (
                      <Icon size={25} strokeWidth={1.6} />
                    ) : (
                      <span>📦</span>
                    )}
                  </div>

                  <span>{cat.name}</span>
                  <ChevronRight size={14} className="category-arrow" />
                </button>
              );
            })}
          </div>
        </section>

        {/* JUST FOR YOU */}

        <section className="home-section just-for-you-section">
          <div className="home-section-heading">
            <div>
              <span className="section-eyebrow">HANDPICKED FOR YOU</span>
              <h2>
                {activeCategory === "All"
                  ? "Just For You"
                  : activeCategory}
              </h2>
              <p>Explore more products from our collection</p>
            </div>

            <span className="section-count">
              {filteredJustForYou.length} items
            </span>
          </div>

          {filteredJustForYou.length === 0 ? (
            <div className="home-empty">
              {justForYou.length === 0
                ? "More products will appear here as new arrivals are added."
                : "No products found in this category."}
            </div>
          ) : (
            <div className="home-products-grid">
              {filteredJustForYou.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* PROFESSIONAL FOOTER */}

      <footer className="home-footer">
        <div className="home-footer-inner">
          <div className="footer-brand">
            <h2>S.S Collection</h2>
            <p>
              Your destination for fashion, lifestyle, electronics and
              everyday essentials. Discover quality products at great prices.
            </p>
          </div>

          <div className="footer-links-column">
            <h3>Customer Information</h3>

            <Link href="/privacy-policy">
              <ShieldCheck size={16} />
              Privacy Policy
            </Link>

            <Link href="/return-policy">
              <RefreshCcw size={16} />
              Return & Refund Policy
            </Link>

            <Link href="/terms-and-conditions">
              <FileText size={16} />
              Terms & Conditions
            </Link>
          </div>

          <div className="footer-links-column">
            <h3>Shopping</h3>

            <Link href="/cart">
              <ShoppingCart size={16} />
              Shopping Cart
            </Link>

            {/* HELP & SUPPORT - OPENS EXISTING TOPBAR CHAT */}
            <button
              type="button"
              onClick={openChat}
              className="footer-help-button"
            >
              <ChevronRight size={16} />
              Help & Support
            </button>
          </div>
        </div>

        <div className="home-footer-bottom">
          <p>
            © {new Date().getFullYear()} S.S Collection. All rights reserved.
          </p>
          <p>Designed for a better shopping experience.</p>
        </div>
      </footer>

      <style jsx>{`
        .home-page {
          width: 100%;
          min-height: 100vh;
          padding-bottom: 30px;
        }

        .home-category-strip {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 25px;
          padding: 13px 20px;
          overflow-x: auto;
          white-space: nowrap;
          background: var(--glass-bg);
          backdrop-filter: var(--glass-blur);
          -webkit-backdrop-filter: var(--glass-blur);
          border-bottom: 1px solid var(--border);
          scrollbar-width: none;
        }

        .home-category-strip::-webkit-scrollbar,
        .new-arrivals-track::-webkit-scrollbar {
          display: none;
        }

        .home-category-strip button {
          flex-shrink: 0;
          padding: 5px 2px;
          border: none;
          border-bottom: 2px solid transparent;
          background: transparent;
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 500;
          transition: 0.2s ease;
        }

        .home-category-strip button:hover,
        .home-category-strip button.home-category-active {
          color: var(--accent);
          border-bottom-color: var(--accent);
        }

        .home-container {
          width: 100%;
          max-width: 1320px;
          margin: 0 auto;
          padding: 22px 24px;
        }

        .home-section {
          width: 100%;
          max-width: 1240px;
          margin: 0 auto 42px;
        }

        .home-section-heading {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 15px;
          margin-bottom: 20px;
        }

        .home-section-heading h2 {
          margin: 5px 0;
          color: var(--text-primary);
          font-size: 25px;
          font-weight: 750;
          letter-spacing: -0.7px;
        }

        .home-section-heading p {
          margin: 0;
          color: var(--text-muted);
          font-size: 13px;
        }

        .section-eyebrow {
          color: var(--accent);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 2px;
        }

        .section-count {
          flex-shrink: 0;
          color: var(--text-muted);
          font-size: 12px;
          padding-bottom: 4px;
        }

        .centered-heading {
          justify-content: center;
          text-align: center;
        }

        .new-arrivals-section {
          padding: 25px;
          border: 1px solid rgba(248, 86, 6, 0.12);
          border-radius: 18px;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.98),
            rgba(255, 247, 242, 0.9)
          );
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.035);
        }

        .new-arrivals-track {
          display: flex;
          gap: 16px;
          width: 100%;
          overflow-x: auto;
          padding: 3px 2px 12px;
          scroll-snap-type: x mandatory;
          scrollbar-width: none;
        }

        .new-arrival-card {
          flex: 0 0 215px;
          min-width: 0;
          scroll-snap-align: start;
        }

        .home-category-grid {
          width: 100%;
          max-width: 1050px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 15px;
        }

        .home-category-card {
          position: relative;
          min-height: 115px;
          padding: 18px 14px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          border: 1px solid var(--border);
          border-radius: 13px;
          background: #fff;
          color: var(--text-primary);
          font-size: 13px;
          font-weight: 600;
          transition: transform 0.2s ease, border-color 0.2s ease,
            box-shadow 0.2s ease;
        }

        .home-category-card:hover,
        .home-category-card.selected {
          transform: translateY(-3px);
          border-color: rgba(248, 86, 6, 0.4);
          box-shadow: 0 8px 22px rgba(248, 86, 6, 0.08);
        }

        .home-category-icon {
          width: 49px;
          height: 49px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: rgba(248, 86, 6, 0.08);
          color: var(--accent);
        }

        .category-arrow {
          position: absolute;
          right: 10px;
          top: 10px;
          color: #bbb;
        }

        .home-products-grid {
          width: 100%;
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 16px;
        }

        .home-empty {
          width: 100%;
          padding: 45px 20px;
          border: 1px dashed var(--border);
          border-radius: 13px;
          background: rgba(255, 255, 255, 0.7);
          color: var(--text-muted);
          font-size: 14px;
          text-align: center;
        }

        .home-footer {
          width: 100%;
          margin-top: 45px;
          padding: 45px 24px 0;
          background: #171717;
          color: #fff;
        }

        .home-footer-inner {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1.5fr 1fr 1fr;
          gap: 55px;
          padding-bottom: 35px;
        }

        .footer-brand h2 {
          margin: 0 0 13px;
          color: #fff;
          font-size: 23px;
          font-weight: 800;
        }

        .footer-brand p {
          max-width: 380px;
          margin: 0;
          color: #aaa;
          font-size: 13px;
          line-height: 1.9;
        }

        .footer-links-column {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 13px;
        }

        .footer-links-column h3 {
          margin: 0 0 5px;
          color: #fff;
          font-size: 14px;
          font-weight: 700;
        }

        .footer-links-column a {
          display: flex;
          align-items: center;
          gap: 9px;
          color: #aaa;
          font-size: 13px;
          transition: color 0.2s ease;
        }

        .footer-links-column a:hover {
          color: #ff8a50;
        }

        /* Help button ko footer links jaisa look */
        .footer-help-button {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 0;
          border: none;
          background: transparent;
          color: #aaa;
          font-family: inherit;
          font-size: 13px;
          font-weight: 400;
          cursor: pointer;
          text-align: left;
          transition: color 0.2s ease;
        }

        .footer-help-button:hover {
          color: #ff8a50;
        }

        .home-footer-bottom {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 17px 0;
          border-top: 1px solid rgba(255, 255, 255, 0.12);
          display: flex;
          justify-content: space-between;
          gap: 15px;
        }

        .home-footer-bottom p {
          margin: 0;
          color: #888;
          font-size: 11px;
        }

        @media (max-width: 1100px) {
          .home-products-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
        }

        @media (max-width: 768px) {
          .home-container {
            padding: 14px 12px;
          }

          .home-category-strip {
            justify-content: flex-start;
            gap: 19px;
            padding: 11px 13px;
          }

          .home-section {
            margin-bottom: 30px;
          }

          .home-section-heading h2 {
            font-size: 21px;
          }

          .new-arrivals-section {
            padding: 16px 12px;
            border-radius: 14px;
          }

          .new-arrival-card {
            flex-basis: 165px;
          }

          .home-category-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 9px;
          }

          .home-category-card {
            min-height: 100px;
            padding: 12px 5px;
            font-size: 11px;
          }

          .home-category-icon {
            width: 42px;
            height: 42px;
          }

          .home-products-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
          }

          .home-footer {
            padding: 32px 18px 0;
          }

          .home-footer-inner {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 28px 18px;
          }

          .footer-brand {
            grid-column: 1 / -1;
          }

          .home-footer-bottom {
            flex-direction: column;
            text-align: center;
            align-items: center;
          }
        }

        @media (max-width: 380px) {
          .home-section-heading h2 {
            font-size: 19px;
          }

          .new-arrival-card {
            flex-basis: 150px;
          }

          .home-category-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
      `}</style>
    </div>
  );
}

/* ===== HERO SLIDER ===== */

function HeroSlider({ offers }: { offers: Offer[] }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (offers.length <= 1) return;

    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % offers.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [offers.length]);

  if (offers.length === 0) return null;

  const offer = offers[current];

  return (
    <section
      className="dz-card"
      style={{
        position: "relative",
        overflow: "hidden",
        marginBottom: "28px",
        borderRadius: "14px",
      }}
    >
      {offer.image && (
        <Image
          src={offer.image}
          alt={offer.title || "S.S Collection promotion"}
          width={1200}
          height={400}
          priority
          style={{
            width: "100%",
            height: "auto",
            display: "block",
          }}
        />
      )}
    </section>
  );
}

/* ===== PRODUCT CARD WITH IMAGE + VIDEO SLIDER ===== */

function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();

  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const images =
    product.images?.filter(Boolean).length
      ? product.images.filter(Boolean)
      : product.image
        ? [product.image]
        : [];

  const media = [
    ...images.map((url) => ({
      type: "image" as const,
      url,
    })),
    ...(product.video
      ? [
          {
            type: "video" as const,
            url: product.video,
          },
        ]
      : []),
  ];

  const currentMedia = media[currentIndex];
  const isVideo = currentMedia?.type === "video";

  const discount = product.salePrice
    ? Math.round(
        ((product.price - product.salePrice) / product.price) * 100
      )
    : 0;

  useEffect(() => {
    const element = cardRef.current;

    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        threshold: 0.5,
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible || media.length <= 1 || isVideo) return;

    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % media.length);
    }, 3500);

    return () => clearTimeout(timer);
  }, [currentIndex, isVisible, media.length, isVideo]);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    if (isVisible && isVideo) {
      video.muted = true;

      video.play().catch(() => {
        // Browser autoplay restriction
      });
    } else {
      video.pause();
    }
  }, [isVisible, isVideo, currentIndex]);

  const nextMedia = () => {
    if (media.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % media.length);
    }
  };

  const previousMedia = () => {
    if (media.length > 1) {
      setCurrentIndex(
        (prev) => (prev - 1 + media.length) % media.length
      );
    }
  };

  return (
    <div
      ref={cardRef}
      className="dz-card"
      style={{
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        height: "100%",
      }}
    >
      <div
        style={{
          position: "relative",
          aspectRatio: "1/1",
          background: "#f5f5f5",
          overflow: "hidden",
        }}
      >
        <Link
          href={`/product/${product.id}`}
          aria-label={`View ${product.name}`}
          style={{
            position: "absolute",
            inset: 0,
            display: "block",
          }}
        >
          {currentMedia?.type === "video" ? (
            <video
              ref={videoRef}
              key={currentMedia.url}
              src={currentMedia.url}
              muted
              autoPlay
              playsInline
              preload="metadata"
              onEnded={nextMedia}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : currentMedia ? (
            <img
              src={currentMedia.url}
              alt={product.name}
              loading="lazy"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#777",
                fontSize: "12px",
              }}
            >
              No image
            </div>
          )}
        </Link>

        {discount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "6px",
              left: "6px",
              background: "var(--accent)",
              color: "#fff",
              fontSize: "10px",
              fontWeight: "700",
              padding: "2px 6px",
              borderRadius: "4px",
              zIndex: 3,
              pointerEvents: "none",
            }}
          >
            -{discount}%
          </span>
        )}

        {isVideo && (
          <span
            style={{
              position: "absolute",
              right: "7px",
              top: "7px",
              background: "rgba(0,0,0,0.65)",
              color: "#fff",
              fontSize: "10px",
              padding: "4px 7px",
              borderRadius: "4px",
              pointerEvents: "none",
              zIndex: 3,
            }}
          >
            VIDEO
          </span>
        )}

        {media.length > 1 && (
          <>
            <button
              type="button"
              onClick={previousMedia}
              aria-label="Previous product media"
              style={{
                position: "absolute",
                left: "5px",
                top: "50%",
                transform: "translateY(-50%)",
                border: "none",
                borderRadius: "50%",
                width: "27px",
                height: "27px",
                background: "rgba(0,0,0,0.45)",
                color: "#fff",
                cursor: "pointer",
                zIndex: 4,
              }}
            >
              ‹
            </button>

            <button
              type="button"
              onClick={nextMedia}
              aria-label="Next product media"
              style={{
                position: "absolute",
                right: "5px",
                top: "50%",
                transform: "translateY(-50%)",
                border: "none",
                borderRadius: "50%",
                width: "27px",
                height: "27px",
                background: "rgba(0,0,0,0.45)",
                color: "#fff",
                cursor: "pointer",
                zIndex: 4,
              }}
            >
              ›
            </button>

            <div
              style={{
                position: "absolute",
                bottom: "7px",
                left: 0,
                right: 0,
                display: "flex",
                justifyContent: "center",
                gap: "5px",
                zIndex: 4,
                pointerEvents: "none",
              }}
            >
              {media.map((item, index) => (
                <span
                  key={`${item.url}-${index}`}
                  style={{
                    width: currentIndex === index ? "15px" : "6px",
                    height: "6px",
                    borderRadius: "10px",
                    background:
                      currentIndex === index
                        ? "#fff"
                        : "rgba(255,255,255,0.6)",
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div
        style={{
          padding: "10px",
          display: "flex",
          flexDirection: "column",
          flex: 1,
        }}
      >
        <Link
          href={`/product/${product.id}`}
          style={{
            flex: 1,
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <h3
            className="line-clamp-2"
            style={{
              fontSize: "12px",
              fontWeight: "500",
              marginBottom: "6px",
              lineHeight: "1.3",
              minHeight: "32px",
            }}
          >
            {product.name}
          </h3>

          <div style={{ marginBottom: "6px" }}>
            {product.salePrice ? (
              <div
                style={{
                  display: "flex",
                  gap: "4px",
                  alignItems: "baseline",
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: "700",
                    color: "var(--accent)",
                  }}
                >
                  Rs. {product.salePrice.toLocaleString()}
                </span>

                <span
                  style={{
                    fontSize: "10px",
                    color: "#999",
                    textDecoration: "line-through",
                  }}
                >
                  Rs. {product.price.toLocaleString()}
                </span>
              </div>
            ) : (
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: "700",
                  color: "var(--accent)",
                }}
              >
                Rs. {product.price.toLocaleString()}
              </span>
            )}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              marginBottom: "8px",
            }}
          >
            <Star
              size={10}
              style={{
                fill: "#FFB800",
                color: "#FFB800",
              }}
            />

            <span style={{ fontSize: "10px", color: "#555" }}>
              {product.rating} ({product.reviews})
            </span>
          </div>
        </Link>

        <button
          type="button"
          onClick={() =>
            addToCart({
              id: product.id,
              name: product.name,
              price: product.price,
              salePrice: product.salePrice,
              image: images[0] || "",
            })
          }
          className="dz-btn-primary"
          style={{
            width: "100%",
            padding: "7px",
            fontSize: "11px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "4px",
          }}
        >
          <ShoppingCart size={12} /> Add to Cart
        </button>
      </div>
    </div>
  );
}
