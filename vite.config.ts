import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

/// <reference types="vitest" />

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    server: {
      port: 3000,
      host: "0.0.0.0",
    },
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
        strategies: "generateSW",
        injectRegister: "auto",
        includeAssets: ["favicon.svg"],
        manifest: {
          name: "Mkulima Super App",
          short_name: "Mkulima",
          description:
            "Agricultural inputs marketplace + AI crop advisor for East African farmers.",
          theme_color: "#166534", // brand-700 — aligned with index.html
          background_color: "#fafaf9",
          display: "standalone",
          orientation: "portrait",
          scope: "/",
          start_url: "/",
          icons: [
            // The maskable SVG covers everything; the 192/512 PNG placeholders
            // are referenced here so installability scoring is satisfied.
            // Replace with real PNGs in build step (pwa-asset-generator).
            { src: "/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" },
          ],
        },
        workbox: {
          // HTML is never cached at the SW layer — keeps users from
          // staring at a stale shell after a deploy.
          navigateFallbackDenylist: [/^\/api\//],
          runtimeCaching: [
            // Same-origin API calls: network-first with a short timeout,
            // fall back to last-known response if offline.
            {
              urlPattern: ({ url, request }) =>
                request.method === "GET" && url.pathname.startsWith("/api/"),
              handler: "NetworkFirst",
              options: {
                cacheName: "mkulima-api",
                networkTimeoutSeconds: 4,
                expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            // Images: stale-while-revalidate — show the cached image fast,
            // refresh in the background.
            {
              urlPattern: ({ request }) => request.destination === "image",
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "mkulima-images",
                expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 },
              },
            },
            // Fonts: cache-first for a year — they never change content-wise.
            {
              urlPattern: ({ request }) => request.destination === "font",
              handler: "CacheFirst",
              options: {
                cacheName: "mkulima-fonts",
                expiration: { maxEntries: 40, maxAgeSeconds: 365 * 24 * 60 * 60 },
              },
            },
          ],
          // Don't pre-cache the entire app — let SWR runtime caches handle it.
          // Pre-caching too much delays first install on slow networks.
          globPatterns: ["**/*.{js,css,svg}"],
          maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        },
        devOptions: {
          // Don't run the SW in dev — it caches your work and confuses HMR.
          enabled: false,
        },
      }),
    ],
    define: {
      // Legacy compat — older client code still references process.env.API_KEY,
      // but all real Gemini calls now go through the Laravel API. These keys
      // are NOT shipped in production builds (set VITE_API_URL only).
      "process.env.API_KEY": JSON.stringify(env.GEMINI_API_KEY ?? ""),
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY ?? ""),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: ["./tests/setup.ts"],
      include: ["**/*.{test,spec}.{ts,tsx}"],
      exclude: ["node_modules", "dist", "api"],
    },
  };
});
