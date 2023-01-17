import { Visitor } from '@babel/core'
import { State } from './transformJsx'
import { isLocalPath } from './utils'
import { transform } from './transform'
import { insertVisitor } from './visitor'
import * as t from '@babel/types'

function normalizedLocalSource(code: string, transformLocalImportHelper) {
  return transform(
    code,
    insertVisitor({
      ExportNamedDeclaration: {
        exit(path) {
          path.replaceWith(path.node.declaration)
        },
      },
      ImportDeclaration: {
        exit(path) {
          const { source, specifiers } = path.node
          if (source.value === 'gyron' && specifiers.length === 1) {
            const specifier = specifiers[0]
            if (
              t.isImportSpecifier(specifier) &&
              t.isIdentifier(specifier.imported) &&
              specifier.imported.name === 'h' &&
              specifier.local.name === '_h'
            ) {
              // remove target source import { h as _h } from "gyron";
              path.remove()
            }
          }
        },
      },
    }),
    {
      setup: true,
      hmr: false,
      ssr: false,
      transformLocalImportHelper: transformLocalImportHelper,
    }
  )
}

const visitor: Visitor<State> = {
  ImportDeclaration: {
    exit(path, state) {
      if (state.opts.transformLocalImportHelper && isLocalPath(path)) {
        // import { D as P } from './a' not support
        // const specifiers = path.node.specifiers
        const transformLocalImportHelper = state.opts.transformLocalImportHelper

        const { code, shouldTransform } = transformLocalImportHelper(path)
        if (code && shouldTransform) {
          const ret = normalizedLocalSource(code, transformLocalImportHelper)
          if (ret.ast) {
            t.addComment(
              path.node,
              'leading',
              ` The import statement has been parsed and the bundle has been executed. source: ${path.node.source.value} `
            )
            path.replaceWith(ret.ast.program)
          }
        } else {
          path.remove()
        }
      }
    },
  },
}

export default visitor
