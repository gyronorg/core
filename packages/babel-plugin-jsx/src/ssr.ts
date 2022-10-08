import { Visitor, NodePath } from '@babel/core'
import { State } from './transformJsx'
import { generateHash, insert } from './utils'
import * as t from '@babel/types'

function insertSSRCode(
  path: NodePath<t.FunctionDeclaration | t.VariableDeclarator>,
  state: State
) {
  const { identifier, filepath } = generateHash(path, state)

  const ssrPath = t.expressionStatement(
    t.assignmentExpression(
      '=',
      t.memberExpression(identifier, t.identifier('__ssr_uri')),
      t.stringLiteral(filepath)
    )
  )
  const ssrName = t.expressionStatement(
    t.assignmentExpression(
      '=',
      t.memberExpression(identifier, t.identifier('__ssr_name')),
      t.stringLiteral(identifier.name)
    )
  )

  insert(path, ssrPath)
  insert(path, ssrName)
}

export default {
  JSXElement: {
    enter(path, state) {
      if (state.opts.ssr) {
        const parent = path.findParent(
          (path) => path.isVariableDeclarator() || path.isFunctionDeclaration()
        ) as NodePath<t.VariableDeclarator | t.FunctionDeclaration>
        if (parent) {
          insertSSRCode(parent, state)
        }
      }
    },
  },
} as Visitor<State>
