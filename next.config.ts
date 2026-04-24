import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
// @ts-expect-error: TAURI is set by the Tauri CLI.
const isTauri = process.env.TAURI === "1";
// @ts-expect-error: TAURI_DEV_HOST is set by the Tauri CLI.
const internalHost = process.env.TAURI_DEV_HOST || "localhost";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  // Tauri bundles a static export of the frontend, so use SSG.
  // The web build (e.g. Vercel) keeps SSR/ISR and Image Optimization enabled.
  // See https://v2.tauri.app/start/frontend/nextjs/
  ...(isTauri && {
    output: "export",
    images: {
      unoptimized: true,
    },
    assetPrefix: isProd ? undefined : `http://${internalHost}:3000`,
  }),
};

export default nextConfig;
