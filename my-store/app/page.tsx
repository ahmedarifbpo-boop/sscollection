
import HomeClient from "./HomeClient";

async function getData() {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    const fetchOptions: RequestInit = {
      cache: "no-store",
    };

    const [prodRes, catRes, offerRes] = await Promise.all([
      fetch(`${baseUrl}/api/products`, fetchOptions),
      fetch(`${baseUrl}/api/categories`, fetchOptions),
      fetch(`${baseUrl}/api/offers`, fetchOptions),
    ]);

    const [prodData, catData, offerData] = await Promise.all([
      prodRes.ok ? prodRes.json() : Promise.resolve({ products: [] }),
      catRes.ok ? catRes.json() : Promise.resolve({ categories: [] }),
      offerRes.ok ? offerRes.json() : Promise.resolve({ offers: [] }),
    ]);

    return {
      products: prodData.products || [],
      categories: catData.categories || [],
      offers: offerData.offers || [],
    };
  } catch (error) {
    console.error("Home page fetch error:", error);

    return {
      products: [],
      categories: [],
      offers: [],
    };
  }
}

export default async function Page() {
  const data = await getData();

  return (
    <HomeClient
      initialProducts={data.products}
      initialCategories={data.categories}
      initialOffers={data.offers}
    />
  );
}
