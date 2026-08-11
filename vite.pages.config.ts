import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  root: path.resolve(__dirname, "gh-pages-src"),
  base: "/guagua-work-schedule/",
  plugins: [react()],
  build: {
    outDir: path.resolve(__dirname, "pages-dist"),
    emptyOutDir: true,
  },
});
