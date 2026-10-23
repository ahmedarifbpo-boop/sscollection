import { MetadataRoute } from 'next'
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Base URL ke aakhir mein slash zaroori hai
  const baseUrl = 'https://sscollection-2iih.vercel.app/'; 

  // 1. Main Pages (Har page ke aakhir mein slash hai)
  const routes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}`, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}cart/`, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}search/`, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
  ];

  // 2. Products
  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const products = await prisma.product.findMany({
      select: { id: true, updatedAt: true },
    });

    productRoutes = products.map((product) => ({
      url: `${baseUrl}product/${product.id}/`, // Product link ke aakhir mein bhi slash
      lastModified: product.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));
  } catch (error) {
    console.error("Sitemap products error:", error);
  }

  return [...routes, ...productRoutes];
}