import { defineConfig } from "vite";
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss()
  ],
  base: '/unit-tw-to-fl/'
})
