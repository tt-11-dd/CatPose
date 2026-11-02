import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  // relative base so the same build can later be wrapped by Capacitor Android
  base: "./",
  plugins: [react(), tailwindcss(), cloudflare()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  optimizeDeps: {
    exclude: ["@imgly/background-removal", "onnxruntime-web"],
  },
  server: {
    host: true,
    port: 5177,
  },
});
