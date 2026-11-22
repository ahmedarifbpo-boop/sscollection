
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { headers } from "next/headers";

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  salePrice?: number | null;
  image?: string;
  images?: string[];
}

interface LayoutProps {
  children: ReactNode;
}

interface MetadataProps {
  params: Promise<{ id: string }>;
}

async function getSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_BASE_URL;

  if (configuredUrl) {
    return configuredUrl.replace(/\/+$/, "").startsWith("http")
      ? configuredUrl.replace(/\/+$/, "")
      : `https://${configuredUrl.replace(/\/+$/, "")}`;
  }

  const headerList = await headers();

  const host =
    headerList.get("x-forwarded-host") ||
    headerList.get("host");

  const protocol =
    headerList.get("x-forwarded-proto")?.split(",")[0].trim() ||
    "https";

  if (host) {
    return `${protocol}://${host}`;
  }

  const vercelUrl = process.env.VERCEL_URL;

  if (vercelUrl) {
    return `https://${vercelUrl}`;
  }

  return "http://localhost:3000";
}

async function getProduct(
  id: string,
  siteUrl: string
): Promise<Product | null> {
  try {
    const response = await fetch(
      `${siteUrl}/api/products/${encodeURIComponent(id)}`,
      { cache: "no-store" }
    );

    if (!response.ok) return null;

    const data = await response.json();

    return data.product || null;
  } catch (error) {
    console.error("Product metadata error:", error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: MetadataProps): Promise<Metadata> {
  const { id } = await params;

  const siteUrl = await getSiteUrl();
  const product = await getProduct(id, siteUrl);

  if (!product) {
    return {
      title: "S.S Collection",
      description: "Explore products at S.S Collection.",
    };
  }

  const productName = product.name || "Product";

  const finalPrice =
    product.salePrice && product.salePrice > 0
      ? product.salePrice
      : product.price;

  const priceText = `Rs. ${Number(finalPrice).toLocaleString("en-PK")}`;

  const description = [
    productName,
    `Price: ${priceText}.`,
    product.description || "Shop now at S.S Collection.",
  ]
    .filter(Boolean)
    .join(" ");

  const productImage =
    product.images?.find(
      (image) => typeof image === "string" && image.trim() !== ""
    ) || product.image;

  let absoluteImageUrl: string | undefined;

  if (productImage) {
    try {
      absoluteImageUrl = new URL(productImage, siteUrl).toString();
    } catch {
      absoluteImageUrl = undefined;
    }
  }

  const productUrl = `${siteUrl}/product/${encodeURIComponent(id)}`;

  return {
    title: `${productName} | S.S Collection`,
    description,

    alternates: {
      canonical: productUrl,
    },

    openGraph: {
      type: "website",
      url: productUrl,
      siteName: "S.S Collection",
      title: `${productName} | S.S Collection`,
      description,
      ...(absoluteImageUrl
        ? {
            images: [
              {
                url: absoluteImageUrl,
                alt: productName,
                width: 1200,
                height: 630,
              },
            ],
          }
        : {}),
    },

    twitter: {
      card: "summary_large_image",
      title: `${productName} | S.S Collection`,
      description,
      ...(absoluteImageUrl
        ? { images: [absoluteImageUrl] }
        : {}),
    },
  };
}

export default function ProductLayout({ children }: LayoutProps) {
  return <>{children}</>;
}
