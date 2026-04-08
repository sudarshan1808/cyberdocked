import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const API_URL = "https://mern-backend-rtvi.onrender.com";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: API_URL,
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
