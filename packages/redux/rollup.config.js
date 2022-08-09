import packageJson from './package.json'
import dts from 'rollup-plugin-dts'
import del from 'rollup-plugin-delete'

export default {
  input: 'src/index.ts',
  output: { file: packageJson.types, format: 'esm' },
  external: ['@gyron/runtime'],
  plugins: [
    dts(),
    del({
      targets: 'dist',
    }),
  ],
}
