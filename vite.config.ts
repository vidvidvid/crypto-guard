import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dotenv from "dotenv";
import { nodePolyfills } from "vite-plugin-node-polyfills";

dotenv.config();

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
        contentScript: "public/contentScript.js",
      },
      output: {
        entryFileNames: (chunkInfo) => {
          return chunkInfo.name === "contentScript"
            ? "[name].js"
            : "assets/[name]-[hash].js";
        },
      },
    },
  },
});
