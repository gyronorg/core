import * as t from '@babel/types'
import { Visitor, NodePath } from '@babel/core'
import { hashIds } from './hmr'

const hasJSX = (parentPath: NodePath<t.Program>) => {
  let fileHasJSX = false
  parentPath.traverse({
    JSXElement(path) {
      // skip ts error
      fileHasJSX = true
      path.stop()
    },
    JSXFragment(path) {
      fileHasJSX = true
      path.stop()
    },
  })

  return fileHasJSX
}

export default {
  Program: {
    enter(path) {
      if (hasJSX(path)) {
        const importNames = ['h']
        const specifiers: Array<
          | t.ImportSpecifier
          | t.ImportDefaultSpecifier
          | t.ImportNamespaceSpecifier
        > = importNames.map((name) => {
          return t.importSpecifier(t.identifier(`_${name}`), t.identifier(name))
        })
        path.unshiftContainer(
          'body',
          t.importDeclaration(specifiers, t.stringLiteral('@gyron/runtime'))
        )
      }
    },
    exit() {
      // clean up the cached hash values in the module so that the next hmr update will update them properly
      hashIds.length = 0
    },
  },
} as Visitor<t.Node>
