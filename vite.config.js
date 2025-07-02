import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import wasm from "vite-plugin-wasm";

export default defineConfig({
  plugins: [react(), wasm()],
  optimizeDeps: {
    // Add tiktoken to optimizeDeps to pre-bundle it
    include: ["tiktoken"],
  },
  build: {
    // Enable top-level await
    target: "esnext",
  },
});
