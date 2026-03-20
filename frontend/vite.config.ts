import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: '/',
  server: {
    host: "0.0.0.0", // Use IPv4 for better compatibility on VMs
    port: 8080,
    proxy: {
      // Proxy all /api requests to the backend on port 3316
      '/api': {
        target: 'http://127.0.0.1:3316',
        changeOrigin: true,
        secure: false,
      },
      // Keep support for the subpath if needed
      '/dpr-project/api': {
        target: 'http://127.0.0.1:3316',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/dpr-project\/api/, '/api'),
      },
    }
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
}));
