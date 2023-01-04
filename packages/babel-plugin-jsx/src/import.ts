import * as t from '@babel/types'
import { Visitor, NodePath } from '@babel/core'
import { hashIds } from './hmr'
import { hashSSR } from './ssr'
import { addNamed } from '@babel/helper-module-imports'
import { State } from './transformJsx'

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

const visitor: Visitor<State> = {
  Program: {
    enter(path) {
      if (hasJSX(path)) {
        const importNames = ['h']
        importNames.forEach((name) => {
          return addNamed(path, name, 'gyron', { nameHint: `_${name}` })
        })
      }
    },
    exit() {
      // clean up the cached hash values in the module so that the next hmr update will update them properly
      hashIds.length = 0
      hashSSR.length = 0
    },
  },
}

export default visitor
