import hash from 'hash-sum'
import generate from '@babel/generator'
import traverse from '@babel/traverse'
import { parse } from '@babel/parser'
import { visitor } from '../src'

export function transform(file: string, setup?: boolean) {
  const ast = parse(file, {
    plugins: ['jsx', 'typescript'],
    sourceType: 'module',
  })

  if (ast) {
    traverse(ast, visitor, null, {
      opts: {
        hmr: true,
        setup: setup,
      },
      file: {
        opts: {
          filename: hash(file),
        },
      },
    })
    return generate(ast, {}, file)
  } else {
    console.warn('[babel-plugin-jsx]: Transform invalid syntax')
    return {
      code: file,
    }
  }
}

export function trim(str: string) {
  return str.replace(/[\n\s]/g, '')
}
