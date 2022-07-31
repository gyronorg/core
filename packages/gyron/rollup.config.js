import packageJson from './package.json'
import dts from 'rollup-plugin-dts'
import del from 'rollup-plugin-delete'

export default {
  input: 'src/index.ts',
  output: { file: packageJson.types, format: 'esm' },
  plugins: [
    dts(),
    del({
      targets: 'dist',
    }),
  ],
}
