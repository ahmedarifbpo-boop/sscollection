import { MetadataRoute } from 'next'
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://sscollection-2iih.vercel.app/'; 

  // 1. Main Pages
  const routes: MetadataRoute.Sitemap = ['', 'cart', 'search'].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 1,
  }));

  // 2. Saare Products (Build Crash se bachne ke liye try-catch lagaya hai)
  let productRoutes: MetadataRoute.Sitemap = [];
  
  try {
    const products = await prisma.product.findMany({
      select: { id: true, updatedAt: true },
    });

    productRoutes = products.map((product) => ({
      url: `${baseUrl}product/${product.id}`,
      lastModified: product.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch (error) {
    // Agar build ke waqt database connect na ho, to crash na ho balke sirf main pages dikhaye
    console.error("Sitemap build error (ignoring products):", error);
  }

  return [...routes, ...productRoutes];
}