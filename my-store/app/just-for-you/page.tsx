
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ProductCard, type Product } from "../HomeClient";

export const dynamic = "force-dynamic";

async function getProducts(): Promise<Product[]> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    const response = await fetch(`${baseUrl}/api/products`, {
      cache: "no-store",
    });

    if (!response.ok) return [];

    const data = await response.json();

    return Array.isArray(data.products) ? data.products : [];
  } catch (error) {
    console.error("Just For You products error:", error);
    return [];
  }
}

export default async function JustForYouPage() {
  const products = await getProducts();

  // Keep the same rule as the homepage:
  // first 8 products are New Arrivals.
  const justForYouProducts = products.slice(8);

  return (
    <main className="just-page">
      <div className="just-page-container">
        <Link href="/" className="back-link">
          <ChevronLeft size={17} />
          Back to Home
        </Link>

        <header className="page-heading">
          <span>HANDPICKED FOR YOU</span>
          <h1>Just For You</h1>
          <p>
            Explore our complete collection and find something you love.
          </p>
        </header>

        <div className="products-info">
          <span>All Products</span>
          <span>{justForYouProducts.length} products</span>
        </div>

        {justForYouProducts.length === 0 ? (
          <div className="empty-state">
            No products available right now.
          </div>
        ) : (
          <div className="products-grid">
            {justForYouProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      <style>{`
        .just-page {
          min-height: 100vh;
          width: 100%;
          background: var(--bg);
          padding: 28px 24px 55px;
          box-sizing: border-box;
        }

        .just-page-container {
          max-width: 1320px;
          width: 100%;
          margin: 0 auto;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          margin-bottom: 28px;
          color: var(--text-secondary);
          text-decoration: none;
          font-size: 13px;
        }

        .back-link:hover {
          color: var(--accent);
        }

        .page-heading {
          margin-bottom: 28px;
        }

        .page-heading > span {
          color: var(--accent);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 2px;
        }

        .page-heading h1 {
          margin: 7px 0;
          color: var(--text-primary);
          font-size: clamp(25px, 4vw, 34px);
          font-weight: 750;
          letter-spacing: -0.8px;
        }

        .page-heading p {
          margin: 0;
          color: var(--text-muted);
          font-size: 14px;
          line-height: 1.6;
        }

        .products-info {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 0;
          margin-bottom: 16px;
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          color: var(--text-secondary);
          font-size: 13px;
        }

        .products-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 16px;
          align-items: stretch;
        }

        .empty-state {
          padding: 55px 20px;
          border: 1px dashed var(--border);
          border-radius: 12px;
          text-align: center;
          color: var(--text-muted);
          background: var(--surface);
        }

        @media (max-width: 1100px) {
          .products-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
        }

        @media (max-width: 768px) {
          .just-page {
            padding: 18px 12px 35px;
          }

          .back-link {
            margin-bottom: 20px;
          }

          .page-heading {
            margin-bottom: 20px;
          }

          .page-heading p {
            font-size: 12px;
          }

          .products-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
          }
        }
      `}</style>
    </main>
  );
}
