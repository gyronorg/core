import type { NodePath, Visitor } from '@babel/core'
import type { VisitNodeFunction } from '@babel/traverse'
import { types as t } from '@babel/core'
import { State } from '../transformJsx'
import { isBodyContainJSX } from '../utils'
import { addNamed } from '@babel/helper-module-imports'
import { DestructuringTransformer } from './util'

function transformParamsToUpdateExpression(
  node: t.ObjectPattern,
  path: NodePath<t.FunctionExpression | t.ArrowFunctionExpression>
) {
  const program = path.findParent((path) =>
    path.isProgram()
  ) as NodePath<t.Program>
  if (program) {
    // 1, import onBeforeUpdate
    addNamed(program, 'onBeforeUpdate', 'gyron', {
      nameHint: '_onBeforeUpdate',
    })
    // 2, generate the auxiliary code
    const destructuring = new DestructuringTransformer({
      scope: path.scope,
      arrayLikeIsIterable: true,
      iterableIsArray: true,
      objectRestNoSymbols: true,
    })

    const nodes = destructuring.init(node, t.identifier('props'))

    const helperStatement = t.callExpression(t.identifier('_onBeforeUpdate'), [
      t.arrowFunctionExpression(
        [t.identifier('_'), t.identifier('props')],
        t.blockStatement(nodes)
      ),
    ])

    const block = path.get('body') as NodePath<t.BlockStatement>
    block.unshiftContainer('body', helperStatement)
    t.addComment(
      block.node.body[0],
      'leading',
      ' Auxiliary update of deconstructed props',
      true
    )
  }
}

function enterHook(
  path: NodePath<t.FunctionExpression | t.ArrowFunctionExpression>,
  state: State
) {
  if (
    state.opts.setup &&
    path.parentPath.isCallExpression() &&
    isBodyContainJSX(path.parentPath.node)
  ) {
    // FC or FCA or FCD
    const params = path.node.params
    if (t.isObjectPattern(params[0]) && t.isBlockStatement(path.node.body)) {
      transformParamsToUpdateExpression(params[0], path)
    }
  }
}

const enterFunction: VisitNodeFunction<State, t.FunctionExpression> = enterHook

const enterArrowFunction: VisitNodeFunction<State, t.ArrowFunctionExpression> =
  enterHook

const visitor: Visitor<State> = {
  FunctionExpression: {
    enter: enterFunction,
  },
  ArrowFunctionExpression: {
    enter: enterArrowFunction,
  },
}

export default visitor
