import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @sparticuz/chromium and puppeteer-core resolve their binary/asset
  // paths at runtime relative to their own package location — bundling
  // them breaks that. Keep them external so Vercel's Node runtime
  // requires them straight from node_modules instead.
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
  // @sparticuz/chromium's compressed Chromium binary (node_modules/
  // @sparticuz/chromium/bin/*.br) is loaded dynamically at runtime, not
  // via a static require() path Next's file tracer can discover on its
  // own — without this, Vercel's deployed function is missing the bin/
  // directory entirely and chromium.executablePath() throws "input
  // directory does not exist" (confirmed against a real deployment).
  outputFileTracingIncludes: {
    "/api/prescriptions/[id]/pdf": ["./node_modules/@sparticuz/chromium/bin/**/*"],
    "/api/medcerts/[id]/pdf": ["./node_modules/@sparticuz/chromium/bin/**/*"],
  },
};

export default nextConfig;
