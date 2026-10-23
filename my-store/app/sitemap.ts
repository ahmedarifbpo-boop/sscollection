import { MetadataRoute } from 'next'
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Aakhir mein slash (/) add kiya hai taake GSC property se match kare
  const baseUrl = 'https://sscollection-2iih.vercel.app/'; 

  // 1. Main Pages (Ab baseUrl mein slash hai, to route se pehle wala slash hata dein)
  const routes = ['', 'cart', 'search'].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 1,
  }));

  // 2. Saare Products
  const products = await prisma.product.findMany({
    select: { id: true, updatedAt: true },
  });

  const productRoutes = products.map((product) => ({
    url: `${baseUrl}product/${product.id}`,
    lastModified: product.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [...routes, ...productRoutes];
}