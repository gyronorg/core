module.exports = {
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testEnvironment: 'jsdom',
  globals: {
    __DEV__: true,
    __WARN__: false,
    'ts-jest': {
      babelConfig: true,
    },
  },
  setupFiles: ['./tests/setup.ts'],
  moduleNameMapper: {
    '^lodash-es$': 'lodash',
  },
}
