import { types as t } from '@babel/core'
import { State } from '../transformJsx'
import { isBodyContainJSX } from '../utils'
import { addNamed } from '@babel/helper-module-imports'
import { DestructuringTransformer } from './util'
import type { NodePath, Visitor } from '@babel/core'
import type { VisitNodeFunction } from '@babel/traverse'

function transformParamsToUpdateExpression(
  node: t.ObjectPattern,
  path: NodePath<t.FunctionExpression | t.ArrowFunctionExpression>
) {
  const program = path.findParent((path) =>
    path.isProgram()
  ) as NodePath<t.Program>
  if (program) {
    // 第一步，导入 onBeforeUpdate
    addNamed(program, 'onBeforeUpdate', 'gyron', {
      nameHint: '_onBeforeUpdate',
    })
    // 生成辅助代码
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

const enter: VisitNodeFunction<
  State,
  t.FunctionExpression | t.ArrowFunctionExpression
> = (path, state) => {
  if (
    state.opts.setup &&
    path.parentPath.isCallExpression() &&
    isBodyContainJSX(path.parentPath.node)
  ) {
    // FC or FCA
    const params = path.node.params
    if (t.isObjectPattern(params[0]) && t.isBlockStatement(path.node.body)) {
      transformParamsToUpdateExpression(params[0], path)
    }
  }
}

export default {
  FunctionExpression: {
    enter: enter,
  },
  ArrowFunctionExpression: {
    enter: enter,
  },
} as Visitor<State>
