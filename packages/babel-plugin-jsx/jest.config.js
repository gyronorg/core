/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  globals: {
    __DEV__: true,
    __WARN__: false,
  },
  setupFiles: ['./tests/jest.setup.ts'],
  moduleNameMapper: {
    '^lodash-es$': 'lodash',
    '^esbuild-wasm$': 'esbuild',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        babelConfig: true,
      },
    ],
  },
}
