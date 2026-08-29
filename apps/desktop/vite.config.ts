import path from "path"
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@bino/types": path.resolve(__dirname, "../../packages/types/src"),
      "@bino/ui/styles.css": path.resolve(__dirname, "../../packages/ui/src/styles/globals.css"),
      "@bino/ui": path.resolve(__dirname, "../../packages/ui/src"),
      "@bino/data": path.resolve(__dirname, "../../packages/data/src"),
      "@bino/store": path.resolve(__dirname, "../../packages/store/src"),
    },
  },
})
