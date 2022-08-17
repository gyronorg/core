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

/**
 * Determine if the incoming parameter is a virtual node
 * ```js
 * import { isVNode, h } from 'gyron'
 *
 * const App = h(() => {
 *   return h('div', 'async anchor')
 * })
 *
 * isVNode(App) // true
 * ```
 * @api global
 * @returns boolean
 */
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

/**
 * Determine if the incoming parameter is a component node
 * ```js
 * import { isVNodeComponent, h } from 'gyron'
 *
 * const App = h(() => {
 *   return h('div', 'async anchor')
 * })
 *
 * isVNodeComponent(App) // true
 * ```
 * @api global
 * @returns boolean
 */
export function isVNodeComponent(n: VNode): n is VNode<ComponentSetupFunction> {
  return isVNode(n) && isFunction(n.type) && n.nodeType === NodeType.Component
}
