import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*.trycloudflare.com"],
  typescript: { ignoreBuildErrors: true },
  
  // 👇 Ye naya add kiya gaya hai Next.js Images ke liye
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Har https website ki image allow karega (Cloudinary, AWS, apna domain, etc.)
      },
    ],
  },
};

export default nextConfig;