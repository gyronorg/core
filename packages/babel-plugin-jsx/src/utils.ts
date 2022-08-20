import { traverse } from '@babel/core'
import htmlTags from 'html-tags'
import * as t from '@babel/types'

export function transformJSXMemberExpression(
  node: t.JSXMemberExpression
): t.MemberExpression {
  const objectPath = node.object
  const propertyPath = node.property
  const transformedObject = t.isJSXMemberExpression(objectPath)
    ? transformJSXMemberExpression(node.object as t.JSXMemberExpression)
    : t.isJSXIdentifier(objectPath)
    ? t.identifier(objectPath.name)
    : t.nullLiteral()
  const transformedProperty = t.identifier(propertyPath.name)
  return t.memberExpression(transformedObject, transformedProperty)
}

export function isCustomComponent(node: t.JSXOpeningElement) {
  if (t.isJSXIdentifier(node.name)) {
    const { name } = node.name
    return !htmlTags.includes(name as any)
  }

  return true
}

export function isBodyContainJSX(
  node:
    | t.ArrowFunctionExpression
    | t.FunctionDeclaration
    | t.VariableDeclarator
    | t.CallExpression
) {
  let isContainJSX = false

  if (t.isCallExpression(node)) {
    if (t.isIdentifier(node.callee)) {
      return node.callee.name === 'FC' || node.callee.name === 'FCA'
    }
    return false
  }
  if (t.isVariableDeclarator(node)) {
    if (t.isCallExpression(node.init) && t.isIdentifier(node.init.callee)) {
      return node.init.callee.name === 'FC' || node.init.callee.name === 'FCA'
    }
    if (
      t.isArrowFunctionExpression(node.init) ||
      t.isFunctionExpression(node.init)
    ) {
      traverse(node.init.body, {
        noScope: true,
        JSXElement(path) {
          isContainJSX = true
          path.stop()
        },
      })
    }
  } else {
    traverse(node.body, {
      noScope: true,
      JSXElement(path) {
        isContainJSX = true
        path.stop()
      },
    })
  }

  return isContainJSX
}
