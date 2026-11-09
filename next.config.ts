import type { NextConfig } from "next";

// When deployed to GitHub Pages as a project site (https://<user>.github.io/<repo>/),
// assets must be served from /<repo>. The deploy workflow sets NEXT_PUBLIC_BASE_PATH.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export", // fully static site in ./out — works on GitHub Pages, nginx, anywhere
  basePath,
  assetPrefix: basePath || undefined,
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
