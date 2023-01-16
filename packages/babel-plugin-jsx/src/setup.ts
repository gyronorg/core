import { Visitor } from '@babel/core'
import { State } from './transformJsx'
import * as t from '@babel/types'

const visitor: Visitor<State> = {
  CallExpression: {
    enter(path, state) {
      if (state.opts.setup) {
        const callee = path.get('callee')
        if (
          callee.isIdentifier() &&
          (callee.node.name === 'FC' || callee.node.name === 'FCA')
        ) {
          const fn = path.get('arguments')[0]
          if (fn.isArrowFunctionExpression() || fn.isFunctionExpression()) {
            const params = fn.node.params
            fn.traverse({
              ReturnStatement(path) {
                const parent = path.findParent(
                  (path) =>
                    path.isArrowFunctionExpression() ||
                    path.isFunctionExpression()
                )
                if (parent.node === fn.node) {
                  const argument = path.get('argument')
                  if (argument.isJSXElement() || argument.isJSXFragment()) {
                    const renderFunction = t.arrowFunctionExpression(
                      params,
                      argument.node
                    )
                    argument.replaceWith(renderFunction)
                  }
                }
              },
            })
          }
        }
      }
    },
  },
}

export default visitor
