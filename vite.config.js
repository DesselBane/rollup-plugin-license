import { defineConfig } from 'vite'
import {resolve} from 'path'
import {createVuePlugin} from 'vite-plugin-vue2'
import license from 'rollup-plugin-license'

// https://vitejs.dev/config/
export default defineConfig({
  root: resolve(__dirname,'src'),
  assetsInclude: resolve(__dirname,'src','assets'),
  
  plugins: [createVuePlugin(),
    license({
      sourcemap: false,
      debug: true,
      cwd: resolve(__dirname),
      thirdParty: {
        output: {
          file: resolve(__dirname, 'dist', 'licenses.txt'),
          encoding: 'utf-8',
        },
        allow: {
          test: '(ISC OR MIT)',
          failOnUnlicensed: true,
          failOnViolation: true,
        },
      },
    })]
})
