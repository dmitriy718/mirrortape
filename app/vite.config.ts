import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
export default defineConfig({
  base: "/",
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 3000,
    proxy: {
      "/api": "http://127.0.0.1:3100",
      "/health": "http://127.0.0.1:3100",
    },
  },
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "./src") } },
});
