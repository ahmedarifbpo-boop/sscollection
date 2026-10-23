import { MetadataRoute } from 'next'
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Aapki website ka main URL (Vercel wala link ya domain)
  const baseUrl = 'https://sscollection-2iih.vercel.app'; 

  // 1. Main Pages
  const routes = ['', '/cart', '/search'].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 1,
  }));

  // 2. Saare Products Database se layein
  const products = await prisma.product.findMany({
    select: { id: true, updatedAt: true },
  });

  const productRoutes = products.map((product) => ({
    url: `${baseUrl}/product/${product.id}`,
    lastModified: product.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [...routes, ...productRoutes];
}