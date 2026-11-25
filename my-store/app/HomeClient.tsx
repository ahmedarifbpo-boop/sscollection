"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
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
  ChevronLeft,
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

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  salePrice: number | null;
  stock: number;
  isManuallyOutOfStock?: boolean;
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
  image: string | null;
  video?: string | null;
  ctaText: string;
  ctaLink: string;
}

/* ===== ADSTERRA SETTINGS ===== */

// Set to false to hide the ad completely.
const ADS_ENABLED = true;

// Social Bar (floating notification-style ad, takes no page space).
const SOCIAL_BAR_ENABLED = true;
const SOCIAL_BAR_SRC =
  "https://bauval.org/14/5611a03205d92b1bff3c1c559e2859b9";

const ADSTERRA_CODE = `
<script>
  atOptions = {
    'key' : '6ac1bfaa862232cf9a6a114abfd8404f',
    'format' : 'iframe',
    'height' : 600,
    'width' : 160,
    'params' : {}
  };
</script>
<script data-cfasync="false" src="https://bauval.org/22/6ac1bfaa862232cf9a6a114abfd8404f"></script>
`;

/* ===== ADSTERRA CODE PARSER ===== */

function parseAdsterraCode(code: string) {
  if (!code || !code.trim()) return null;

  // Any https:// (or protocol-relative //) script URL
  const rawScriptUrl = code.match(
    /src\s*=\s*["']((?:https:)?\/\/[^"']+)["']/i
  )?.[1];

  const scriptUrl = rawScriptUrl
    ? rawScriptUrl.startsWith("//")
      ? `https:${rawScriptUrl}`
      : rawScriptUrl
    : undefined;

  const key = code.match(
    /['"]key['"]\s*:\s*['"]([a-f0-9]{32})['"]/i
  )?.[1];

  const width = Number(
    code.match(/['"]width['"]\s*:\s*(\d+)/i)?.[1] || 160
  );

  const height = Number(
    code.match(/['"]height['"]\s*:\s*(\d+)/i)?.[1] || 600
  );

  const allowedSizes = ["160x600", "300x250", "320x50", "320x100", "468x60", "728x90"];

  if (!scriptUrl || !key || !allowedSizes.includes(`${width}x${height}`)) {
    return null;
  }

  return { scriptUrl, key, width, height };
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


  const [isProductsLoading, setIsProductsLoading] = useState(
    initialProducts.length === 0
  );

  const justForYouRef = useRef<HTMLDivElement>(null);
  const { openChat } = useChat();

  const showAd = ADS_ENABLED && parseAdsterraCode(ADSTERRA_CODE) !== null;

  // Becomes true only when the ad has really loaded inside the iframe.
  // Until then the ad takes NO space on the page.
  const [adLoaded, setAdLoaded] = useState(false);

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
      } finally {
        if (isMounted) {
          setIsProductsLoading(false);
        }
      }
    };

    fetchLatestProducts();

    const interval = setInterval(fetchLatestProducts, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    justForYouRef.current?.scrollTo({
      left: 0,
      behavior: "smooth",
    });
  }, [activeCategory]);

  const newArrivals = products.slice(0, 8);
  const justForYou = products.slice(8);

  const filteredJustForYou =
    activeCategory === "All"
      ? justForYou
      : justForYou.filter(
          (product) => product.category === activeCategory
        );

  const filteredNewArrivals =
    activeCategory === "All"
      ? newArrivals
      : newArrivals.filter(
          (product) => product.category === activeCategory
        );

  const sliderProducts = filteredJustForYou.slice(0, 9);

  const slideJustForYou = (direction: "left" | "right") => {
    const track = justForYouRef.current;
    if (!track) return;

    const card = track.querySelector<HTMLElement>(
      ".just-for-you-card"
    );

    const cardWidth = card?.getBoundingClientRect().width || 210;
    const gap = 14;

    track.scrollBy({
      left:
        direction === "right"
          ? (cardWidth + gap) * 2
          : -(cardWidth + gap) * 2,
      behavior: "smooth",
    });
  };

  const renderSkeletonCards = (count: number, className: string) =>
    Array.from({ length: count }).map((_, index) => (
      <div className={className} key={`skeleton-${index}`}>
        <div className="skeleton-product-card">
          <div className="skeleton-product-image skeleton-shimmer" />
          <div className="skeleton-product-content">
            <div className="skeleton-line skeleton-title skeleton-shimmer" />
            <div className="skeleton-line skeleton-title-short skeleton-shimmer" />
            <div className="skeleton-line skeleton-price skeleton-shimmer" />
            <div className="skeleton-line skeleton-rating skeleton-shimmer" />
            <div className="skeleton-button skeleton-shimmer" />
          </div>
        </div>
      </div>
    ));

  return (
    <div className="home-page">
      {SOCIAL_BAR_ENABLED && (
        <Script
          id="adsterra-social-bar"
          src={SOCIAL_BAR_SRC}
          strategy="afterInteractive"
          data-cfasync="false"
        />
      )}

      <div className="home-category-strip">
        <button
          onClick={() => setActiveCategory("All")}
          className={
            activeCategory === "All" ? "home-category-active" : ""
          }
        >
          All
        </button>

        {initialCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.name)}
            className={
              activeCategory === cat.name
                ? "home-category-active"
                : ""
            }
          >
            {cat.name}
          </button>
        ))}
      </div>

      <main className="home-container">
        <HeroSlider offers={initialOffers} />

        <section className="home-section new-arrivals-section">
          <div className="home-section-heading">
            <div>
              <span className="section-eyebrow">JUST LANDED</span>
              <h2>New Arrivals</h2>
              <p>Discover our latest additions</p>
            </div>

            {!isProductsLoading && (
              <span className="section-count">
                {filteredNewArrivals.length} items
              </span>
            )}
          </div>

          {isProductsLoading ? (
            <div className="new-arrivals-track">
              {renderSkeletonCards(8, "new-arrival-card")}
            </div>
          ) : filteredNewArrivals.length === 0 ? (
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

        <section className="home-section category-section">
          <div className="home-section-heading centered-heading">
            <div>
              <span className="section-eyebrow">
                EXPLORE OUR COLLECTION
              </span>
              <h2>Shop by Category</h2>
              <p>Find exactly what you are looking for</p>
            </div>
          </div>

          <div
            className={`category-content-layout ${
              showAd && adLoaded ? "with-ad" : ""
            }`}
          >
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
                        <Icon size={22} strokeWidth={1.6} />
                      ) : (
                        <span>📦</span>
                      )}
                    </div>

                    <span>{cat.name}</span>

                    <ChevronRight
                      size={13}
                      className="category-arrow"
                    />
                  </button>
                );
              })}
            </div>

            {showAd && (
              <div
                className={`category-ad-container ${
                  adLoaded ? "" : "ad-pending"
                }`}
              >
                <AdsterraBanner
                  code={ADSTERRA_CODE}
                  onLoaded={() => setAdLoaded(true)}
                />
              </div>
            )}
          </div>
        </section>

        <section className="home-section just-for-you-section">
          <div className="just-for-you-heading">
            <div>
              <span className="section-eyebrow">
                HANDPICKED FOR YOU
              </span>

              <h2>
                {activeCategory === "All"
                  ? "Just For You"
                  : activeCategory}
              </h2>

              <p>Explore more products from our collection</p>
            </div>

            <div className="just-for-you-actions">
              <Link
                href="/just-for-you"
                className="view-more-button"
              >
                View More <ChevronRight size={16} />
              </Link>

              <div className="slider-controls">
                <button
                  type="button"
                  onClick={() => slideJustForYou("left")}
                  aria-label="Previous products"
                >
                  <ChevronLeft size={19} />
                </button>

                <button
                  type="button"
                  onClick={() => slideJustForYou("right")}
                  aria-label="Next products"
                >
                  <ChevronRight size={19} />
                </button>
              </div>
            </div>
          </div>

          {isProductsLoading ? (
            <div className="just-for-you-track">
              {renderSkeletonCards(6, "just-for-you-card")}
            </div>
          ) : filteredJustForYou.length === 0 ? (
            <div className="home-empty">
              {justForYou.length === 0
                ? "More products will appear here as new arrivals are added."
                : "No products found in this category."}
            </div>
          ) : (
            <div
              className="just-for-you-track"
              ref={justForYouRef}
            >
              {sliderProducts.map((product) => (
                <div
                  className="just-for-you-card"
                  key={product.id}
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

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
              Return &amp; Refund Policy
            </Link>

            <Link href="/terms-and-conditions">
              <FileText size={16} />
              Terms &amp; Conditions
            </Link>
          </div>

          <div className="footer-links-column">
            <h3>Shopping</h3>

            <Link href="/cart">
              <ShoppingCart size={16} />
              Shopping Cart
            </Link>

            <button
              type="button"
              onClick={openChat}
              className="footer-help-button"
            >
              <ChevronRight size={16} />
              Help &amp; Support
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
          overflow-x: hidden;
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
        .new-arrivals-track::-webkit-scrollbar,
        .just-for-you-track::-webkit-scrollbar {
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
          cursor: pointer;
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
          box-sizing: border-box;
        }

        .home-section {
          width: 100%;
          max-width: 1240px;
          margin: 0 auto 22px;
          min-width: 0;
        }

        .home-section-heading {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 15px;
          margin-bottom: 16px;
        }

        .home-section-heading h2,
        .just-for-you-heading h2 {
          margin: 5px 0;
          color: var(--text-primary);
          font-size: 25px;
          font-weight: 750;
          letter-spacing: -0.7px;
        }

        .home-section-heading p,
        .just-for-you-heading p {
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

        /* ===== CATEGORY + AD LAYOUT ===== */

        .category-content-layout {
          width: 100%;
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          align-items: start;
          gap: 20px;
        }

        /* Two columns only when a valid ad is present */
        .category-content-layout.with-ad {
          grid-template-columns: minmax(0, 1fr) 160px;
        }

        .category-content-layout .home-category-grid {
          width: 100%;
          max-width: 1050px;
          margin: 0;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }

        .category-ad-container {
          width: 160px;
          height: 600px;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          overflow: hidden;
        }

        /* Ad is loading (or never loaded): keep it out of the layout */
        .category-ad-container.ad-pending {
          position: absolute;
          top: 0;
          left: -9999px;
          width: 160px;
          height: 600px;
          pointer-events: none;
        }

        .home-category-card {
          position: relative;
          min-height: 92px;
          padding: 12px 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 7px;
          border: 1px solid var(--border);
          border-radius: 11px;
          background: #fff;
          color: var(--text-primary);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
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
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: rgba(248, 86, 6, 0.08);
          color: var(--accent);
        }

        .category-arrow {
          position: absolute;
          right: 8px;
          top: 8px;
          color: #bbb;
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
          box-sizing: border-box;
        }

        .skeleton-product-card {
          height: 100%;
          min-width: 0;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          border: 1px solid var(--border);
          border-radius: 10px;
          background: var(--surface, #fff);
        }

        .skeleton-shimmer {
          position: relative;
          overflow: hidden;
          background: #eeeeee;
        }

        .skeleton-shimmer::after {
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
          content: "";
          transform: translateX(-100%);
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.72),
            transparent
          );
          animation: skeleton-shimmer 1.35s infinite;
        }

        @keyframes skeleton-shimmer {
          100% {
            transform: translateX(100%);
          }
        }

        .skeleton-product-image {
          width: 100%;
          aspect-ratio: 1 / 1;
          flex-shrink: 0;
        }

        .skeleton-product-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 9px;
          padding: 10px;
        }

        .skeleton-line {
          height: 10px;
          border-radius: 5px;
        }

        .skeleton-title {
          width: 92%;
        }

        .skeleton-title-short {
          width: 62%;
        }

        .skeleton-price {
          width: 48%;
          height: 13px;
          margin-top: 3px;
        }

        .skeleton-rating {
          width: 38%;
          height: 9px;
        }

        .skeleton-button {
          width: 100%;
          height: 29px;
          margin-top: auto;
          border-radius: 5px;
        }

        .just-for-you-section {
          padding: 24px;
          border: 1px solid var(--border);
          border-radius: 15px;
          background: var(--surface);
          box-shadow: 0 5px 22px rgba(0, 0, 0, 0.035);
          box-sizing: border-box;
        }

        .just-for-you-heading {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 15px;
          margin-bottom: 16px;
        }

        .just-for-you-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }

        .view-more-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          padding: 9px 15px;
          border-radius: 5px;
          background: var(--accent);
          color: #fff;
          text-decoration: none;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
          transition: opacity 0.2s ease, transform 0.2s ease;
        }

        .view-more-button:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        .slider-controls {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .slider-controls button {
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border);
          border-radius: 50%;
          background: var(--surface);
          color: var(--text-primary);
          cursor: pointer;
          transition: 0.2s ease;
        }

        .slider-controls button:hover {
          color: #fff;
          border-color: var(--accent);
          background: var(--accent);
        }

        .just-for-you-track {
          display: flex;
          align-items: stretch;
          gap: 14px;
          width: 100%;
          overflow-x: auto;
          overflow-y: hidden;
          padding: 3px 2px 12px;
          scroll-snap-type: x mandatory;
          scroll-behavior: smooth;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
        }

        .just-for-you-card {
          flex: 0 0 210px;
          min-width: 0;
          scroll-snap-align: start;
        }

        .home-footer {
          width: 100%;
          margin-top: 30px;
          padding: 45px 24px 0;
          background: #171717;
          color: #fff;
          box-sizing: border-box;
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
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .footer-links-column a:hover {
          color: #ff8a50;
        }

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
          .category-content-layout {
            gap: 16px;
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
            margin-bottom: 20px;
          }

          .home-section-heading h2,
          .just-for-you-heading h2 {
            font-size: 21px;
          }

          .new-arrivals-section {
            padding: 16px 12px;
            border-radius: 14px;
          }

          .new-arrival-card {
            flex-basis: 165px;
          }

          /* Single column on mobile, ad shown below categories */
          .category-content-layout,
          .category-content-layout.with-ad {
            grid-template-columns: minmax(0, 1fr);
            justify-items: center;
            gap: 14px;
          }

          .category-content-layout .home-category-grid {
            width: 100%;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 8px;
          }

          .home-category-card {
            min-height: 78px;
            padding: 9px 4px;
            gap: 6px;
            font-size: 10px;
          }

          .home-category-icon {
            width: 34px;
            height: 34px;
          }

          .category-ad-container.ad-pending {
            width: 160px;
            height: 600px;
          }

          .category-ad-container {
            width: 100%;
            height: auto;
            justify-content: center;
            align-items: center;
            overflow: hidden;
          }

          .just-for-you-section {
            padding: 16px 12px;
            border-radius: 12px;
          }

          .just-for-you-heading {
            align-items: center;
            gap: 8px;
          }

          .just-for-you-actions {
            gap: 7px;
          }

          .view-more-button {
            padding: 8px 10px;
            font-size: 11px;
          }

          .slider-controls {
            display: none;
          }

          .just-for-you-card {
            flex-basis: 165px;
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

        @media (max-width: 480px) {
          .just-for-you-heading {
            flex-wrap: wrap;
            align-items: flex-end;
          }

          .just-for-you-actions {
            margin-left: auto;
          }

          .just-for-you-card {
            flex-basis: 155px;
          }
        }

        @media (max-width: 380px) {
          .home-section-heading h2,
          .just-for-you-heading h2 {
            font-size: 19px;
          }

          .new-arrival-card {
            flex-basis: 150px;
          }

          .category-content-layout .home-category-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .just-for-you-card {
            flex-basis: 145px;
          }
        }
      `}</style>
    </div>
  );
}

/* ===== HERO SLIDER ===== */

function HeroSlider({ offers }: { offers: Offer[] }) {
  const [current, setCurrent] = useState(0);
  const offer = offers[current];

  useEffect(() => {
    if (offers.length <= 1 || offer?.video) return;

    const timer = setTimeout(() => {
      setCurrent((prev) => (prev + 1) % offers.length);
    }, 4000);

    return () => clearTimeout(timer);
  }, [current, offers.length, offer?.video]);

  if (offers.length === 0) return null;

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % offers.length);
  };

  return (
    <section
      className="dz-card"
      style={{
        position: "relative",
        overflow: "hidden",
        marginBottom: "28px",
        borderRadius: "14px",
        background: "#f5f5f5",
      }}
    >
      {offer.video ? (
        <video
          key={offer.id}
          src={offer.video}
          autoPlay
          muted
          playsInline
          preload="metadata"
          onEnded={nextSlide}
          style={{
            width: "100%",
            height: "auto",
            aspectRatio: "1200 / 400",
            objectFit: "cover",
            display: "block",
          }}
        />
      ) : offer.image ? (
        <Image
          key={offer.id}
          src={offer.image}
          alt={offer.title || "S.S Collection promotion"}
          width={1200}
          height={400}
          priority={current === 0}
          sizes="100vw"
          style={{
            width: "100%",
            height: "auto",
            display: "block",
          }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            aspectRatio: "1200 / 400",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          Banner media unavailable
        </div>
      )}

      {offers.length > 1 && (
        <div
          style={{
            position: "absolute",
            bottom: "12px",
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            gap: "7px",
            zIndex: 5,
          }}
        >
          {offers.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setCurrent(index)}
              aria-label={`Go to banner ${index + 1}`}
              style={{
                width: current === index ? "22px" : "7px",
                height: "7px",
                padding: 0,
                border: "none",
                borderRadius: "10px",
                background:
                  current === index
                    ? "#fff"
                    : "rgba(255,255,255,0.65)",
                cursor: "pointer",
                transition: "0.2s",
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/* ===== REUSABLE PRODUCT CARD ===== */

export function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();

  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const images = product.images?.filter(Boolean).length
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

  const discount = product.salePrice && product.price > 0
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
      { threshold: 0.5 }
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
      video.play().catch(() => {});
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
              style={{ fill: "#FFB800", color: "#FFB800" }}
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

/* ===== ADSTERRA BANNER ===== */

function AdsterraBanner({
  code,
  onLoaded,
}: {
  code: string;
  onLoaded?: () => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (
        event.source === iframeRef.current?.contentWindow &&
        event.data === "ss-ad-loaded"
      ) {
        onLoaded?.();
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [onLoaded]);

  const parsed = parseAdsterraCode(code);
  if (!parsed) return null;

  const { scriptUrl, key, width, height } = parsed;

  // NOTE: atOptions is assigned WITHOUT `var` so that Adsterra's script
  // can delete it (fixes "Cannot delete property 'atOptions'" error).
  const srcDoc = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          html, body {
            width: ${width}px;
            height: ${height}px;
            overflow: hidden;
            background: transparent;
          }
        </style>
        <script>
          atOptions = {
            'key': '${key}',
            'format': 'iframe',
            'height': ${height},
            'width': ${width},
            'params': {}
          };
        </script>
        <script
          data-cfasync="false"
          src="${scriptUrl}"
        ></script>
      </head>
      <body>
        <script>
          (function () {
            var sent = false;
            function check() {
              if (sent || !document.body) return;
              var el = document.body.querySelector("iframe, img, canvas, video, a");
              if (el && (el.offsetHeight > 20 || el.offsetWidth > 20)) {
                sent = true;
                parent.postMessage("ss-ad-loaded", "*");
              }
            }
            new MutationObserver(check).observe(document.documentElement, {
              childList: true,
              subtree: true
            });
            var n = 0;
            var t = setInterval(function () {
              check();
              if (sent || ++n > 40) clearInterval(t);
            }, 250);
          })();
        </script>
      </body>
    </html>
  `;

  return (
    <iframe
      title="Advertisement"
      srcDoc={srcDoc}
      width={width}
      height={height}
      sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
      ref={iframeRef}
      referrerPolicy="no-referrer"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        maxWidth: "100%",
        border: "none",
        display: "block",
        overflow: "hidden",
        background: "transparent",
      }}
    />
  );
}