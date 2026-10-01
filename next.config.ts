import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @sparticuz/chromium and puppeteer-core resolve their binary/asset
  // paths at runtime relative to their own package location — bundling
  // them breaks that. Keep them external so Vercel's Node runtime
  // requires them straight from node_modules instead.
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
};

export default nextConfig;
