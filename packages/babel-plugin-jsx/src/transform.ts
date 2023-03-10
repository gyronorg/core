import {
  traverse,
  Visitor,
  transform as babelTransform,
  PluginItem,
} from '@babel/core'
import { parse } from '@babel/parser'
import { warn } from '@gyron/logger'
import { Options } from './transformJsx'
import { insertVisitor } from './visitor'
import generate, { GeneratorResult } from '@babel/generator'
import hash from 'hash-sum'
import * as t from '@babel/types'

export function ts2js(code: string, origin?: PluginItem) {
  return babelTransform(code, {
    plugins: [origin || '@babel/transform-typescript'],
  })
}

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
    traverse(ast, localVisitor || insertVisitor(), null, {
      opts: options || {
        hmr: true,
        ssr: true,
        setup: true,
      },
      file: {
        opts: {
          filename: hash(file),
        },
        ast: {
          program: ast.program,
        },
      },
    })
    return {
      ...generate(ast, {}, file),
      ast,
    }
  } else {
    warn('babel-plugin-jsx', 'Transform invalid syntax')
    return {
      ast: null,
      map: null,
      code: file,
    }
  }
}
