import { isVNode, isVNodeComponent } from './shared'
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
  ComponentSetupFunction,
} from './component'
import { UserRef } from './ref'
import { TransitionHooks } from './Transition'

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
  [x: string]: any
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

export interface VNode<
  T extends VNodeType = VNodeType,
  P extends VNodeProps = VNodeProps
> {
  flag: symbol
  type: T
  nodeType: NodeType
  props: Partial<P>
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
  transition?: TransitionHooks
  // development hydrate component uri
  __uri?: string
}

export interface VNodeProps extends VNodeEvent, ComponentDefaultProps {
  [k: string]: any
}

/**
 * Clone the `VNode` node.
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
 * @param vnode The node to be copied, or it can be a normal value.
 * @returns Nodes after cloning.
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
 * Merge `props` to the target node.
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
 * @param vnode Nodes that need to be merged.
 * @param props The attributes to be copied to the node.
 * @returns Returns the merged node.
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

export function mergeVNodeWith(n1: VNode, n2: VNode) {
  if (isVNodeComponent(n1) && isVNodeComponent(n2)) {
    n1.component = n2.component
  }
  n1.el = n2.el
  return n1
}

export function createVNode(
  tag: unknown,
  props?: Partial<VNodeProps>,
  children?: VNodeChildren
): VNode {
  let vnodeProps = props ? props : {}

  const key = vnodeProps.key || null
  let type: VNodeType = Text
  let nodeType: NodeType = NodeType.Text
  let _uri: string

  if (isString(tag) && (!isUndefined(props) || !isUndefined(children))) {
    type = Element
    nodeType = NodeType.Element
  } else if (isFunction(tag)) {
    type = tag
    nodeType = NodeType.Component
    vnodeProps = omit(vnodeProps, 'key')

    // ssr mode merge context to props
    const __ssr_uri = (tag as ComponentSetupFunction).__ssr_uri
    if (__ssr_uri) {
      _uri = __ssr_uri
    }
  } else if (isArray(tag)) {
    type = Fragment
    nodeType = NodeType.Fragment
    children = mergeVNode(tag.map(normalizeVNode), vnodeProps)
  } else {
    children = tag as TextContent
  }

  const vnode: VNode = {
    type: type,
    nodeType: nodeType,
    key: key,
    flag: Gyron,
    props: vnodeProps,
    children: children,
    __uri: _uri,
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
  }
  if (Array.isArray(value)) {
    return createVNode(value.slice() as VNode[])
  }
  return createVNode('' + value)
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
