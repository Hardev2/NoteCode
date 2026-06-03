import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const dir = path.dirname(fileURLToPath(import.meta.url));
const emptyNodeModule = path.resolve(dir, "src/utils/empty-node-module.js");

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      fs: emptyNodeModule,
      path: emptyNodeModule,
    },
  },
});
