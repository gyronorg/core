import { Visitor, NodePath } from '@babel/core'
import { State } from './transformJsx'
import { generateHash, insert } from './utils'
import * as t from '@babel/types'

export const hashSSR = []

function insertSSRCode(
  path: NodePath<t.FunctionDeclaration | t.VariableDeclarator>,
  state: State
) {
  const { identifier, filepath, error } = generateHash(path, state)

  if (error) {
    return
  }

  if (hashSSR.includes(filepath + identifier.name)) {
    return null
  } else {
    hashSSR.push(filepath + identifier.name)
  }

  const ssrPath = t.expressionStatement(
    t.assignmentExpression(
      '=',
      t.memberExpression(identifier, t.identifier('__ssr_uri')),
      t.stringLiteral(filepath + '?name=' + identifier.name)
    )
  )

  insert(path, ssrPath)
}

const visitor: Visitor<State> = {
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
}

export default visitor
