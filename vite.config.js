import { defineConfig } from 'vite'
import {resolve} from 'path'
import {createVuePlugin} from 'vite-plugin-vue2'

// https://vitejs.dev/config/
export default defineConfig({
  root: resolve(__dirname,'src'),
  assetsInclude: resolve(__dirname,'src','assets'),
  
  plugins: [createVuePlugin()]
})
