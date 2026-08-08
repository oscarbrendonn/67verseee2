import vinext from "vinext";
import { defineConfig } from "vite";

// Fast local visual QA configuration. Production continues to use vite.config.ts
// with the existing Cloudflare and Sites integrations unchanged.
export default defineConfig({
  css: {
    // The world route does not use Tailwind utilities. Skipping the project-wide
    // Tailwind scan keeps the local visual-QA server responsive on large asset folders.
    postcss: { plugins: [] },
  },
  optimizeDeps: {
    noDiscovery: true,
    include: [],
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: ["localhost", "127.0.0.1", "terminal.local"],
    watch: { useFsEvents: false, usePolling: true, interval: 250 },
  },
  plugins: [vinext()],
});
