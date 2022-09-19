const { pathsToModuleNameMapper } = require('ts-jest')
const { compilerOptions } = require('./tsconfig.json')

module.exports = {
  preset: 'ts-jest',
  testMatch: [`${process.env.PWD}/tests/**/(*.)+(spec|test).[jt]s?(x)`],
  testEnvironment: 'jsdom',
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: '<rootDir>',
  }),
  collectCoverageFrom: [`${process.env.PWD}/src/**/*.ts`],
  globals: {
    __DEV__: true,
    __WARN__: false,
  },
}
