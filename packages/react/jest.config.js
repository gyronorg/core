const { pathsToModuleNameMapper } = require('ts-jest')
const { compilerOptions } = require('../../tsconfig.json')

module.exports = {
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testEnvironment: 'jsdom',
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: '<rootDir>../../',
  }),
  collectCoverageFrom: ['src/*.ts'],
  setupFiles: ['./tests/setup.ts'],
  globals: {
    __DEV__: true,
    __WARN__: false,
    'ts-jest': {
      babelConfig: true,
    },
  },
}
