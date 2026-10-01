import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const base = process.env.VITE_BASE_PATH || '/dalimgari/'

export default defineConfig({
  plugins: [react()],
  base: base.endsWith('/') ? base : `${base}/`,
})
