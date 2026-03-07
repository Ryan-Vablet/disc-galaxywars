import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig(() => {
  const basePath = process.env.VITE_BASE_PATH ?? "/";
  return {
    base: basePath,
    resolve: {
      alias: {
        "@": resolve(__dirname, "./src"),
      },
    },
    test: {
      environment: "jsdom",
      globals: true,
      include: ["src/__tests__/**/*.test.ts"],
    },
  };
});
