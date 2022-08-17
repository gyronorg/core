import { isVNode } from './shared'
import {
  extend,
  isArray,
  isFunction,
  isString,
  isUndefined,
  omit,
  shouldValue,
} from '@gyron/shared'
import {
  Component,
  ComponentDefaultProps,
  ComponentFunction,
  ComponentParentProps,
  ComponentSetupFunction,
} from './component'
import { UserRef } from './ref'

export const Gyron = Symbol.for('gyron')
export const Text = Symbol.for('gyron.text')
export const Element = Symbol.for('gyron.element')
export const Comment = Symbol.for('gyron.comment')
export const Fragment = Symbol.for('gyron.fragment')

type ToUpper<T extends string> = T extends `${infer F}${infer Rest}`
  ? `${Uppercase<F>}${Rest}`
  : never

type ToLower<T extends string> = T extends `${infer F}${infer Rest}`
  ? `${Lowercase<F>}${Rest}`
  : never

type APrefixEvent<K extends string, P extends string> = K extends string
  ? `${P}${ToUpper<K>}`
  : never

type RPrefixEvent<
  K extends string,
  P extends string
> = K extends `${P}${infer Key}` ? ToLower<Key> : never

type Prefix = 'on'

export type VNodeEvent = {
  [Key in APrefixEvent<keyof HTMLElementEventMap, Prefix>]?: (
    e: HTMLElementEventMap[RPrefixEvent<Key, Prefix>]
  ) => any
}

export enum NodeType {
  Fragment = -2,
  Component = -1,
  Element = 1,
  Text = 3,
  Comment = 8,
}
export type TextContent = string | number | boolean | null | undefined
export type Children = VNode | TextContent
export type VNodeChildren = Children | Children[]

export interface VNodeDefaultProps {
  ref: UserRef
  key: string | number
}

export interface RenderElement extends Node {
  __vnode__?: VNode
}

export type VNodeType =
  | string
  | VNode
  | Component
  | ComponentFunction<any>
  | ComponentSetupFunction<any>
  | typeof Text
  | typeof Element
  | typeof Comment
  | typeof Fragment

export interface VNode<T extends VNodeType = VNodeType> {
  flag: symbol
  type: T
  nodeType: NodeType
  props: Partial<VNodeProps>
  el?: RenderElement
  // true flag bits to ensure accurate position when inserting elements
  anchor?: RenderElement
  key?: number | string | symbol
  // parent vnode
  parent?: VNode
  tag?: string
  is?: any
  component?: Component
  // children node
  children?: VNodeChildren
}

export interface VNodeProps
  extends VNodeEvent,
    Partial<ComponentDefaultProps>,
    Partial<ComponentParentProps> {
  [k: string]: any
}

/**
 * 克隆 VNode 节点。
 * ```js
 * import { createComment, cloneVNode, h } from 'gyron'
 *
 * const App = h(() => {
 *   return createComment('async anchor')
 * })
 *
 * App !== cloneVNode(App) // true
 * ```
 * @api global
 * @param vnode 需要拷贝的节点，也可以是普通的值。
 * @returns 克隆后的节点。
 */
export function cloneVNode<T extends VNode | VNode[]>(vnode: T): T {
  if (isArray(vnode)) {
    return vnode.map(cloneVNode) as T
  }

  if (isVNode(vnode)) {
    return extend({}, vnode, {
      flag: Gyron,
    })
  }

  return normalizeVNode(vnode) as T
}

/**
 * 合并`props`到目标节点上。
 * ```javascript
 * import { createComment, mergeVNode, h } from 'gyron'
 *
 * const Child = h(() => {
 *   return createComment('async anchor')
 * })
 *
 * const App = mergeVNode(Child, { class: 'container' })
 * App.props.class === 'container' // true
 * ```
 * @api global
 * @param vnode 需要合并的节点。
 * @param props  要拷贝到节点的属性。
 * @returns 返回合并后的节点。
 */
export function mergeVNode<T extends VNode | VNode[]>(
  vnode: T,
  props: Partial<VNodeProps>
): T {
  if (isArray(vnode)) {
    for (let i = 0; i < vnode.length; i++) {
      const node = normalizeVNode(vnode[i])
      vnode[i] = node
      mergeVNode(node, props)
    }
  } else {
    extend(vnode.props, props)
  }
  return vnode
}

export function createVNode(
  tag: unknown,
  props?: Partial<VNodeProps>,
  children?: VNodeChildren
): VNode {
  let VNodeProps = props ? props : {}

  const key = VNodeProps.key || null
  let type: VNodeType = Text
  let nodeType: NodeType = NodeType.Text

  if (isString(tag) && (!isUndefined(props) || !isUndefined(children))) {
    type = Element
    nodeType = NodeType.Element
  } else if (isFunction(tag)) {
    type = tag
    nodeType = NodeType.Component
    VNodeProps = omit(VNodeProps, 'key')
  } else if (isArray(tag)) {
    type = Fragment
    nodeType = NodeType.Fragment
    children = mergeVNode(tag.map(normalizeVNode), VNodeProps)
  } else {
    children = tag as TextContent
  }
  const vnode: VNode = {
    type: type,
    nodeType: nodeType,
    key: key,
    flag: Gyron,
    props: VNodeProps,
    children: children,
  }
  if (type === Element) {
    vnode.tag = tag as string
  }
  return vnode
}

export function createVNodeComment(children?: string): VNode<typeof Comment> {
  return {
    type: Comment,
    nodeType: NodeType.Comment,
    props: {},
    flag: Gyron,
    children: children,
  }
}

export function normalizeVNode(value: VNodeChildren): VNode {
  if (isVNode(value)) {
    return value
  }
  if (value === null || typeof value === 'boolean') {
    return createVNodeComment()
  } else if (Array.isArray(value)) {
    return createVNode(value.slice() as VNode[])
  } else {
    return createVNode('' + value)
  }
}

export function normalizeChildrenVNode(vnode: VNode) {
  const parent: VNode = vnode

  if (!parent) {
    console.warn(
      'The parent node was not found when formatting the child node, this will raise a PROVIDE error, please check.'
    )
  }

  const children = isArray(vnode.children) ? vnode.children : [vnode.children]

  return children
    .filter(shouldValue)
    .map((node) => normalizeVNodeWithLink(node, parent))
}

export function normalizeVNodeWithLink(children: Children, parent: VNode) {
  const node = normalizeVNode(children)
  node.parent = parent
  return node
}
