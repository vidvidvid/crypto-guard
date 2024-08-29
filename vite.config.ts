import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
  define: {
    "process.env": {},
    global: "window",
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        main: "index.html",
        background: "src/background.ts",
      },
      output: {
        entryFileNames: (chunkInfo) => {
          return chunkInfo.name === "background"
            ? "background.js"
            : "assets/[name]-[hash].js";
        },
      },
    },
  },
  server: {
    headers: {
      "Content-Security-Policy":
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; object-src 'self'",
    },
  },
});
