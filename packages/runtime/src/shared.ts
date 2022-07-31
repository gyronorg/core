import { isFunction } from '@gyron/shared'
import { ComponentSetupFunction } from './component'
import {
  VNode,
  Text,
  Element,
  Comment,
  Fragment,
  Gyron,
  NodeType,
} from './vnode'

export function isVNode(n: any): n is VNode {
  return n && n.flag === Gyron
}

export function isVNodeElement(n: VNode): n is VNode<typeof Element> {
  return n.type === Element
}

export function isVNodeText(n: VNode): n is VNode<typeof Text> {
  return n.type === Text
}

export function isVNodeComment(n: VNode): n is VNode<typeof Comment> {
  return n.type === Comment
}

export function isVNodeFragment(n: VNode): n is VNode<typeof Fragment> {
  return n.type === Fragment
}

export function isVNodeComponent(n: VNode): n is VNode<ComponentSetupFunction> {
  return isVNode(n) && isFunction(n.type) && n.nodeType === NodeType.Component
}
