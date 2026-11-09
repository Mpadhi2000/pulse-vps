import type { NextConfig } from "next";

// GitHub Pages project sites live under /<repo>; the deploy workflow sets this.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export", // fully static site in ./out — GitHub Pages, nginx, anywhere
  basePath,
  assetPrefix: basePath || undefined,
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  env: {
    // Origin of the Pulse API, inlined at build time.
    PULSE_API_URL: process.env.PULSE_API_URL || "https://pulse.mayankpadhi.in",
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
