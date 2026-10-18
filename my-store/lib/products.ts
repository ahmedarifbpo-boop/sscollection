export interface Product {
  id: string;
  name: string;
  price: number;
  salePrice: number | null;
  image: string;
  category: string;
  rating: number;
  reviews: number;
  description: string;
}

export const allProducts: Product[] = [
  {
    id: "1",
    name: "Premium Wireless Headphones with Noise Cancellation",
    price: 12999,
    salePrice: 9999,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500",
    category: "Electronics",
    rating: 4.8,
    reviews: 1240,
    description:
      "Experience premium sound quality with active noise cancellation. Long battery life, comfortable over-ear design, and crystal-clear audio for music, calls, and gaming.",
  },
  {
    id: "2",
    name: "Minimalist Leather Watch for Men",
    price: 8999,
    salePrice: null,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500",
    category: "Fashion",
    rating: 4.6,
    reviews: 890,
    description:
      "Classic minimalist design with genuine leather strap. Water-resistant, precise quartz movement, and elegant look for any occasion.",
  },
  {
    id: "3",
    name: "Designer Polarized Sunglasses UV Protection",
    price: 5499,
    salePrice: 3999,
    image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500",
    category: "Fashion",
    rating: 4.7,
    reviews: 560,
    description:
      "Stylish polarized sunglasses with 100% UV protection. Lightweight frame, anti-glare lenses, perfect for driving and outdoor activities.",
  },
  {
    id: "4",
    name: "Gold Plated Necklace Set with Earrings",
    price: 15999,
    salePrice: 11999,
    image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500",
    category: "Jewellery",
    rating: 4.9,
    reviews: 320,
    description:
      "Elegant gold-plated necklace set with matching earrings. Perfect for weddings, parties, and special occasions. Comes in a gift box.",
  },
  {
    id: "5",
    name: "Smart Fitness Band with Heart Rate Monitor",
    price: 6999,
    salePrice: 5499,
    image: "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=500",
    category: "Electronics",
    rating: 4.5,
    reviews: 2100,
    description:
      "Track your fitness with heart rate monitoring, step counter, sleep tracking, and notifications. Waterproof design with 7-day battery.",
  },
  {
    id: "6",
    name: "Ceramic Flower Vase Set of 3 Pieces",
    price: 3499,
    salePrice: null,
    image: "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=500",
    category: "Home & Living",
    rating: 4.4,
    reviews: 180,
    description:
      "Beautiful ceramic vase set for home decoration. Perfect for fresh flowers or as standalone decorative pieces. Set of 3 different sizes.",
  },
  {
    id: "7",
    name: "Matte Lipstick Long Lasting Waterproof",
    price: 1299,
    salePrice: 899,
    image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=500",
    category: "Beauty",
    rating: 4.6,
    reviews: 3400,
    description:
      "Long-lasting matte lipstick with intense color. Waterproof formula stays up to 12 hours. Available in multiple shades.",
  },
  {
    id: "8",
    name: "Running Sports Shoes Lightweight Breathable",
    price: 7499,
    salePrice: 5999,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500",
    category: "Sports",
    rating: 4.7,
    reviews: 980,
    description:
      "Lightweight running shoes with breathable mesh upper and cushioned sole. Perfect for running, gym, and daily wear.",
  },
];

export const allCategories = [
  "All",
  "Fashion",
  "Electronics",
  "Jewellery",
  "Home & Living",
  "Beauty",
  "Sports",
  "Groceries",
  "Kids",
];