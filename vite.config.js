import { defineConfig } from "vite";
import legacy from "@vitejs/plugin-legacy";

// https://vite.dev/config/
export default defineConfig({
  base: "https://tao-mandalas-jaryd-diamonds-projects.vercel.app/",
  plugins: [
    legacy({
      targets: ["defaults", "not IE 11"],
    }),
  ],
});
