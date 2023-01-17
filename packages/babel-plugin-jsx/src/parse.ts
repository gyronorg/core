import { ParserOptions } from '@babel/core'
import { parse as babelParse } from '@babel/parser'
import { merge } from 'lodash-es'

export function parse(code: string, config?: ParserOptions) {
  const defaultConfig: ParserOptions = {
    sourceType: 'module',
    errorRecovery: true,
    plugins: ['jsx', 'typescript'],
  }
  return babelParse(code, merge(defaultConfig, config))
}
