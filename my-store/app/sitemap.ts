import { MetadataRoute } from 'next'
import { prisma } from "@/lib/prisma";

// 👇 Ye line build ke waqt database connection error ko rokti hai
export const dynamic = 'force-dynamic'; 

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 👇 Yahan 'l' (L) ka istemal kiya hai, 'i' nahi
  const baseUrl = 'https://www.scollection.online';

  // Database se products fetch karein
  let products: any[] = [];

  try {
    products = await prisma.product.findMany({ 
      select: { id: true, updatedAt: true } 
    });
  } catch (e) {
    console.log("Sitemap DB fetch error:", e);
  }

  // Basic Pages (Home, Cart, Search)
  const routes = [
    '', 
    '/cart', 
    '/search'
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // Product Pages (Har product ka apna page)
  const productRoutes = products.map((product) => ({
    url: `${baseUrl}/product/${product.id}`,
    lastModified: product.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }));

  // Dono ko mila kar return karein
  return [...routes, ...productRoutes];
}