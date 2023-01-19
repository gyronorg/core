import { Visitor, NodePath } from '@babel/core'
import { isArray, isNull } from '@gyron/shared'
import { transformJSXMemberExpression } from './utils'
import htmlTags from 'html-tags'
import * as t from '@babel/types'

export type TransformLocalImportHelper = (
  path: NodePath<t.ImportDeclaration>,
  parentModule: string
) => {
  shouldTransform: boolean
  code: string
}

export interface Options {
  setup: boolean
  hmr: boolean
  ssr: boolean
  importSourceMap: Record<string, string>
  rootFileName: string
  parentFileName: string
  fileName: string
  transformLocalImportHelper?: TransformLocalImportHelper
}

export type State = t.Node & {
  opts: Options
  file: {
    opts: {
      filename: string
    }
  }
  addHelper: (name: string) => void
}

export type CallExpressionArgument = Parameters<typeof t.callExpression>[1]

function transform(path: NodePath<t.JSXElement>, children: any) {
  const openElement = path.get('openingElement').node
  const context = transformAttr(openElement.attributes)

  const args: CallExpressionArgument = [t.objectExpression(context)]
  if (isArray(children) && children.length === 1) {
    args.push(children[0])
  } else {
    args.push(t.arrayExpression(children))
  }

  if (t.isJSXIdentifier(openElement.name)) {
    const { name } = openElement.name
    const h = t.identifier('_h')
    if (htmlTags.includes(name as any) || /^[a-z]/.test(name)) {
      args.unshift(t.stringLiteral(name))
      return t.callExpression(h, args)
    } else {
      args.unshift(t.identifier(name))
      return t.callExpression(h, args)
    }
  } else if (t.isJSXMemberExpression(openElement.name)) {
    const h = t.identifier('_h')
    args.unshift(transformJSXMemberExpression(openElement.name))
    return t.callExpression(h, args)
  }

  throw new Error('Not support type: ' + openElement.name.type)
}

function transformAttr(
  attributes: Array<t.JSXAttribute | t.JSXSpreadAttribute>
) {
  const attrs = attributes
    .map((attribute) => {
      if (t.isJSXAttribute(attribute)) {
        const name = t.isJSXIdentifier(attribute.name)
          ? attribute.name.name
          : attribute.name.name.name

        if (isNull(attribute.value)) {
          return t.objectProperty(t.stringLiteral(name), t.booleanLiteral(true))
        }

        if (t.isStringLiteral(attribute.value)) {
          return t.objectProperty(t.stringLiteral(name), attribute.value)
        }

        if (
          t.isJSXExpressionContainer(attribute.value) &&
          !t.isJSXEmptyExpression(attribute.value.expression)
        ) {
          return t.objectProperty(
            t.stringLiteral(name),
            attribute.value.expression
          )
        }
      }
      if (t.isJSXSpreadAttribute(attribute)) {
        return t.spreadElement(attribute.argument)
      }

      console.warn('Syntax conversions not yet supported', attribute)
      return null
    })
    .filter((x) => Boolean(x)) as t.ObjectProperty[]

  return attrs
}

function getChildren(
  paths: NodePath<
    | t.JSXText
    | t.JSXExpressionContainer
    | t.JSXSpreadChild
    | t.JSXElement
    | t.JSXFragment
  >[],
  state: State
) {
  return paths
    .map((path) => {
      if (t.isCallExpression(path.node)) {
        return t.cloneNode(path.node)
      }
      if (path.isJSXText()) {
        if (/^\n?\s+\n?$/.test(path.node.value)) {
          return null
        }
        return t.stringLiteral(path.node.value)
      }
      if (path.isJSXExpressionContainer()) {
        const expression = path.get('expression')
        if (t.isJSXEmptyExpression(expression.node)) {
          return expression.node
        }
        if (t.isIdentifier(expression.node)) {
          return t.identifier(expression.node.name)
        }
        return t.cloneNode(expression.node)
      }
      if (path.isJSXElement()) {
        return transformJSXElement(path, state)
      }
      throw new Error('[GetChildren] invalid syntax ' + path.type)
    })
    .filter((value) => !t.isJSXEmptyExpression(value))
    .filter((value) => value)
}

function transformJSXElement(path: NodePath<t.JSXElement>, state: State) {
  const children = getChildren(path.get('children'), state)

  return transform(path, children)
}

function transformJSXFragment(path: NodePath<t.JSXFragment>, state: State) {
  const children = getChildren(path.get('children'), state)
  const args: CallExpressionArgument = []
  if (isArray(children) && children.length === 1) {
    args.push(children[0])
  } else {
    args.push(t.arrayExpression(children))
  }
  const h = t.identifier('_h')
  return t.callExpression(h, args)
}

const visitor: Visitor<State> = {
  JSXElement: {
    exit(path, state) {
      path.replaceWith(transformJSXElement(path, state))
    },
  },
  JSXFragment: {
    exit(path, state) {
      path.replaceWith(transformJSXFragment(path, state))
    },
  },
}

export default visitor
