import { NodePath, Visitor } from '@babel/core'
import { State } from './transformJsx'
import { generateHash, insert, isBodyContainJSX } from './utils'
import * as t from '@babel/types'

// pass enter JSXElement multiple timing
export const hashIds = []

function insertHMRCode(
  path: NodePath<t.FunctionDeclaration | t.VariableDeclarator>,
  state: State
) {
  const { hashId, identifier } = generateHash(path, state)

  if (hashIds.includes(hashId)) {
    return null
  } else {
    hashIds.push(hashId)
  }

  const hmr = t.expressionStatement(
    t.assignmentExpression(
      '=',
      t.memberExpression(identifier, t.identifier('__hmr_id')),
      t.stringLiteral(hashId)
    )
  )
  const program = path.findParent((path) =>
    path.isProgram()
  ) as NodePath<t.Program>

  insert(path, hmr)

  program.addComment(
    'trailing',
    ` #__hmr_comp_name:${identifier.name}-${hashId}`,
    true
  )
}

function transformDefaultCompHmr(
  path: NodePath<
    t.FunctionDeclaration | t.CallExpression | t.ArrowFunctionExpression
  >
) {
  let init: t.Expression
  if (path.isFunctionDeclaration()) {
    init = t.functionExpression(path.node.id, path.node.params, path.node.body)
  } else {
    init = path.node as t.CallExpression
  }
  const _defaultId = path.parentPath.scope.generateUidIdentifier('_default')
  const _default = t.variableDeclaration('const', [
    t.variableDeclarator(_defaultId, init),
  ])

  path.replaceWith(_defaultId)
  path.parentPath.insertBefore(_default)
  path.scope.registerDeclaration(path)
}

const visitor: Visitor<State> = {
  ExportDefaultDeclaration: {
    enter(path, state) {
      const declaration = path.get('declaration')
      if (
        (declaration.isCallExpression() ||
          declaration.isFunctionDeclaration() ||
          declaration.isArrowFunctionExpression()) &&
        state.opts.hmr &&
        isBodyContainJSX(declaration.node)
      ) {
        // hmr
        transformDefaultCompHmr(declaration)
      }
    },
  },
  JSXElement: {
    enter(path, state) {
      if (state.opts.hmr) {
        const parent = path.findParent(
          (path) => path.isVariableDeclarator() || path.isFunctionDeclaration()
        ) as NodePath<t.VariableDeclarator | t.FunctionDeclaration>
        if (parent) {
          insertHMRCode(parent, state)
        }
      }
    },
  },
}

export default visitor
