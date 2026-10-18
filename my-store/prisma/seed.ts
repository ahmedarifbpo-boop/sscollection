import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // ===== CATEGORIES =====
  const categories = [
    { name: "Fashion", icon: "Shirt" },
    { name: "Electronics", icon: "Smartphone" },
    { name: "Jewellery", icon: "Gem" },
    { name: "Home & Living", icon: "Home" },
    { name: "Beauty", icon: "Sparkles" },
    { name: "Sports", icon: "Dumbbell" },
    { name: "Groceries", icon: "ShoppingBasket" },
    { name: "Kids", icon: "Baby" },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: { icon: cat.icon },
      create: cat,
    });
  }
  console.log(`✅ ${categories.length} categories`);

  // ===== PRODUCTS =====
  const products = [
    {
      name: "Premium Wireless Headphones with Noise Cancellation",
      description:
        "Experience premium sound quality with active noise cancellation. Long battery life, comfortable over-ear design, and crystal-clear audio for music, calls, and gaming.",
      category: "Electronics",
      price: 12999,
      salePrice: 9999,
      stock: 50,
      image:
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500",
      rating: 4.8,
      reviews: 1240,
    },
    {
      name: "Minimalist Leather Watch for Men",
      description:
        "Classic minimalist design with genuine leather strap. Water-resistant, precise quartz movement, and elegant look for any occasion.",
      category: "Fashion",
      price: 8999,
      salePrice: null,
      stock: 30,
      image:
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500",
      rating: 4.6,
      reviews: 890,
    },
    {
      name: "Designer Polarized Sunglasses UV Protection",
      description:
        "Stylish polarized sunglasses with 100% UV protection. Lightweight frame, anti-glare lenses, perfect for driving and outdoor activities.",
      category: "Fashion",
      price: 5499,
      salePrice: 3999,
      stock: 45,
      image:
        "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500",
      rating: 4.7,
      reviews: 560,
    },
    {
      name: "Gold Plated Necklace Set with Earrings",
      description:
        "Elegant gold-plated necklace set with matching earrings. Perfect for weddings, parties, and special occasions. Comes in a gift box.",
      category: "Jewellery",
      price: 15999,
      salePrice: 11999,
      stock: 15,
      image:
        "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500",
      rating: 4.9,
      reviews: 320,
    },
    {
      name: "Smart Fitness Band with Heart Rate Monitor",
      description:
        "Track your fitness with heart rate monitoring, step counter, sleep tracking, and notifications. Waterproof design with 7-day battery.",
      category: "Electronics",
      price: 6999,
      salePrice: 5499,
      stock: 60,
      image:
        "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=500",
      rating: 4.5,
      reviews: 2100,
    },
    {
      name: "Ceramic Flower Vase Set of 3 Pieces",
      description:
        "Beautiful ceramic vase set for home decoration. Perfect for fresh flowers or as standalone decorative pieces. Set of 3 different sizes.",
      category: "Home & Living",
      price: 3499,
      salePrice: null,
      stock: 25,
      image:
        "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=500",
      rating: 4.4,
      reviews: 180,
    },
    {
      name: "Matte Lipstick Long Lasting Waterproof",
      description:
        "Long-lasting matte lipstick with intense color. Waterproof formula stays up to 12 hours. Available in multiple shades.",
      category: "Beauty",
      price: 1299,
      salePrice: 899,
      stock: 100,
      image:
        "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=500",
      rating: 4.6,
      reviews: 3400,
    },
    {
      name: "Running Sports Shoes Lightweight Breathable",
      description:
        "Lightweight running shoes with breathable mesh upper and cushioned sole. Perfect for running, gym, and daily wear.",
      category: "Sports",
      price: 7499,
      salePrice: 5999,
      stock: 40,
      image:
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500",
      rating: 4.7,
      reviews: 980,
    },
  ];

  // Pehle saare products delete karo (fresh seed ke liye)
  await prisma.orderItem.deleteMany({});
  await prisma.product.deleteMany({});

  for (const prod of products) {
    await prisma.product.create({ data: prod });
  }
  console.log(`✅ ${products.length} products`);

  // ===== OFFERS =====
  const offers = [
    {
      title: "Mega Sale is Live!",
      subtitle: "Up to 70% OFF on Fashion, Electronics & More",
      image: "",
      ctaText: "Shop Now",
      ctaLink: "/",
      order: 0,
      active: true,
    },
    {
      title: "Eid Special Collection",
      subtitle: "Flat 40% OFF on Jewellery & Beauty",
      image: "",
      ctaText: "Explore Now",
      ctaLink: "/",
      order: 1,
      active: true,
    },
    {
      title: "Free Delivery Above Rs. 5000",
      subtitle: "Order now and get free home delivery nationwide",
      image: "",
      ctaText: "Start Shopping",
      ctaLink: "/",
      order: 2,
      active: true,
    },
  ];

  await prisma.offer.deleteMany({});
  for (const offer of offers) {
    await prisma.offer.create({ data: offer });
  }
  console.log(`✅ ${offers.length} offers`);

  console.log("");
  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });