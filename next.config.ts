import type { NextConfig } from "next";

// Optional sub-path (e.g. "/pulse"); leave unset on Vercel.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export", // fully static site in ./out — Vercel, nginx, anywhere
  basePath,
  assetPrefix: basePath || undefined,
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  env: {
    // Origin of the Pulse API, inlined at build time.
    PULSE_API_URL: process.env.PULSE_API_URL || "https://pulse-api.mayankpadhi.in",
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
