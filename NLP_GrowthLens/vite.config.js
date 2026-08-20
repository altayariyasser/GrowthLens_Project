import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/GrowthLens_Project/",
  plugins: [react()],
  build: {
    sourcemap: false,
    target: "es2020",
  },
});
