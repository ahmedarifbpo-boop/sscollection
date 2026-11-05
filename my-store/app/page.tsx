import HomeClient from "./HomeClient";

async function getData() {
  try {
    // Yahan apni site ka URL dalein (production mein apna domain dalein)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    const [prodRes, catRes, offerRes] = await Promise.all([
      fetch(`${baseUrl}/api/products`, { next: { revalidate: 60 } }), // 60 sec cache
      fetch(`${baseUrl}/api/categories`, { next: { revalidate: 60 } }),
      fetch(`${baseUrl}/api/offers`, { next: { revalidate: 60 } })
    ]);

    const prodData = prodRes.ok ? await prodRes.json() : { products: [] };
    const catData = catRes.ok ? await catRes.json() : { categories: [] };
    const offerData = offerRes.ok ? await offerRes.json() : { offers: [] };

    return {
      products: prodData.products || [],
      categories: catData.categories || [],
      offers: offerData.offers || []
    };
  } catch (e) {
    console.error("Fetch error:", e);
    return { products: [], categories: [], offers: [] };
  }
}

export default async function Page() {
  const data = await getData();
  
  // Data ko Client Component mein pass kar rahe hain
  return (
    <HomeClient 
      initialProducts={data.products} 
      initialCategories={data.categories} 
      initialOffers={data.offers} 
    />
  );
}