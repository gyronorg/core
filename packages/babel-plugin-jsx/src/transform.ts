import { traverse, Visitor } from '@babel/core'
import { parse } from '@babel/parser'
import { Options } from './transformJsx'
import { visitor } from './visitor'
import generate, { GeneratorResult } from '@babel/generator'
import hash from 'hash-sum'
import * as t from '@babel/types'

export function transform(
  file: string,
  localVisitor?: Visitor<t.Node>,
  options?: Partial<Options>
): GeneratorResult & { ast: t.File } {
  const ast = parse(file, {
    plugins: ['jsx', 'typescript'],
    sourceType: 'module',
  })

  if (ast) {
    traverse(ast, localVisitor || visitor, null, {
      opts: options || {
        hmr: true,
        ssr: true,
        setup: true,
      },
      file: {
        opts: {
          filename: hash(file),
        },
      },
    })
    return {
      ...generate(ast, {}, file),
      ast,
    }
  } else {
    console.warn('[babel-plugin-jsx]: Transform invalid syntax')
    return {
      ast: null,
      map: null,
      code: file,
    }
  }
}
