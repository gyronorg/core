/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  globals: {
    __DEV__: true,
    __WARN__: false,
  },
  setupFiles: ['./tests/setup.ts'],
  moduleNameMapper: {
    '^lodash-es$': 'lodash',
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
