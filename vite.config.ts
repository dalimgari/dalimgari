import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    // Build the isolated preview only; production remains on the legacy entry
    // until parity and deployment-path checks have passed.
    rollupOptions: {
      input: resolve(__dirname, "react-preview.html"),
    },
  },
});
