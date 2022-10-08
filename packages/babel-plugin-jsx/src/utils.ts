import { traverse, NodePath, Visitor, Node } from '@babel/core'
import { State } from './transformJsx'
import { VisitNodeObject, VisitNodeFunction } from '@babel/traverse'
import htmlTags from 'html-tags'
import hash from 'hash-sum'
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

export function generateHash(
  path: NodePath<t.FunctionDeclaration | t.VariableDeclarator>,
  state: State
) {
  const id = path.get('id')
  const filepath = state.file.opts.filename

  let identifier: t.Identifier
  if (path.isFunctionDeclaration()) {
    identifier = path.node.id
  } else {
    if (id.isIdentifier()) {
      identifier = id.node
    } else {
      return null
    }
  }

  const hashId = hash(filepath + identifier.name)

  return {
    hashId,
    identifier,
    filepath,
  }
}

export type IVisitor = {
  [K in t.Node['type']]: {
    enter: VisitNodeFunction<object, t.Node>[]
    exit: VisitNodeFunction<object, t.Node>[]
  }
}
export function initialVisitor(...visitors: Visitor<t.Node>[]): IVisitor {
  return visitors.reduce((prev, visitor) => {
    for (const [key, value] of Object.entries(visitor)) {
      if (!prev[key]) {
        prev[key] = {}
      }
      if (!prev[key]['enter']) {
        prev[key]['enter'] = []
      }
      if (!prev[key]['exit']) {
        prev[key]['exit'] = []
      }
      const obj: VisitNodeObject<object, t.Node> = value
      if (obj.enter) {
        prev[key]['enter'].push(obj.enter)
      }
      if (obj.exit) {
        prev[key]['exit'].push(obj.exit)
      }
    }
    return prev
  }, {}) as unknown as IVisitor
}

export function createVisitor(visitors: IVisitor): Visitor<t.Node> {
  return Object.entries(visitors).reduce((prev, [key, visitor]) => {
    prev[key] = {
      enter(path, state) {
        visitor.enter.forEach((f) => {
          f.call(this, path, state)
        })
      },
      exit(path, state) {
        visitor.exit.forEach((f) => {
          f.call(this, path, state)
        })
      },
    }
    return prev
  }, {})
}

export function insert(path: NodePath<any>, expression: Node) {
  if (path.parentPath.isProgram()) {
    path.parentPath.pushContainer('body', expression)
  } else {
    path.parentPath.insertAfter(expression)
  }
}
