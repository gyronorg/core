/* eslint-disable @typescript-eslint/no-var-requires */
const esbuild = require('esbuild')
const plugin = require('node-stdlib-browser/helpers/esbuild/plugin')
const stdLibBrowser = require('node-stdlib-browser')

esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  sourcemap: true,
  format: 'esm',
  outdir: 'dist/browser',
  platform: 'browser',
  external: ['esbuild-wasm', '@gyron/*', '@babel/*'],
  inject: [
    require.resolve(
      process.env.NX_WORKSPACE_ROOT +
        '/node_modules/node-stdlib-browser/helpers/esbuild/shim.js'
    ),
  ],
  define: {
    global: 'global',
    process: 'process',
    Buffer: 'Buffer',
  },
  plugins: [plugin(stdLibBrowser)],
})
