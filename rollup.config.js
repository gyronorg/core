import dts from 'rollup-plugin-dts'
import del from 'rollup-plugin-delete'

export default {
  input: 'src/index.ts',
  output: { file: 'dist/index.d.ts', format: 'esm' },
  plugins: [
    dts({
      respectExternal: process.env.RESPECT_EXTERNAL === 'runtime',
    }),
    del({
      targets: 'dist',
    }),
  ],
}
