const { pathsToModuleNameMapper } = require('ts-jest')
const { compilerOptions } = require('./tsconfig.json')

/** @type {import('jest').Config} */
module.exports = {
  rootDir: process.cwd(),
  preset: 'ts-jest',
  testMatch: process.argv.includes('--colors')
    ? ['**/*.spec.ts']
    : [`${process.cwd()}/tests/**/(*.)+(spec|test).[jt]s?(x)`],
  testEnvironment: 'jsdom',
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: process.env.PACKAGES ? '<rootDir>../../' : '<rootDir>',
  }),
  collectCoverageFrom: [`./src/**/*.ts`],
  globals: {
    __DEV__: true,
    __WARN__: false,
  },
}
