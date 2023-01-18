import { Visitor } from '@babel/core'
import { State, TransformLocalImportHelper } from './transformJsx'
import { isLocalPath } from './utils'
import { transform } from './transform'
import { insertVisitor } from './visitor'
import * as t from '@babel/types'

function normalizedLocalSource(
  code: string,
  parent: string,
  transformLocalImportHelper: TransformLocalImportHelper
) {
  return transform(
    code,
    insertVisitor({
      ExportNamedDeclaration: {
        enter(path) {
          path.replaceWith(path.node.declaration)
        },
      },
      ImportDeclaration: {
        enter(path) {
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
      parentModule: parent,
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

        const parent = state.opts.parentModule || state.opts.root
        const { code, shouldTransform } = transformLocalImportHelper(
          path,
          parent
        )
        if (code && shouldTransform) {
          const ret = normalizedLocalSource(
            code,
            path.node.source.value,
            transformLocalImportHelper
          )
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
