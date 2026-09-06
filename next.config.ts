import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "organikchicken.com.bd" },
      { protocol: "https", hostname: "cdn.safefoods.com.bd" },
      { protocol: "https", hostname: "www.khaasfood.com" },
      { protocol: "https", hostname: "app.eonbazar.com" },
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "backoffice.ghorerbazar.com" },
    ],
  },
};

export default nextConfig;
