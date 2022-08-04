import { isVNode } from './shared'
import { extend, isArray, isFunction, isString, omit } from '@gyron/shared'
import {
  Component,
  ComponentDefaultProps,
  ComponentFunction,
  ComponentSetupFunction,
} from './component'
import { UserRef } from './ref'
import { VNodeEvent } from './eventType'

export const Gyron = Symbol.for('gyron')
export const Text = Symbol.for('gyron.text')
export const Element = Symbol.for('gyron.element')
export const Comment = Symbol.for('gyron.comment')
export const Fragment = Symbol.for('gyron.fragment')

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
  anchor?: RenderElement
  key?: number | string | symbol
  parent?: VNode
  tag?: string
  is?: any
  component?: Component
  children?: VNodeChildren
}

export interface VNodeProps extends VNodeEvent, Partial<ComponentDefaultProps> {
  [k: string]: any
}

export interface Context {
  set: (k: string | symbol, v: any) => any
  get: (k: string | symbol) => any
  keys: () => IterableIterator<any>
  values: () => IterableIterator<any>
  clear: () => void
}

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

export function mergeVNode<T extends VNode | VNode[] = VNode | VNode[]>(
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
  if (isString(tag)) {
    return createElement(tag, props, children)
  }
  if (isFunction(tag)) {
    return createComponent(tag, props, children)
  }
  if (isArray(tag)) {
    return createFragment(mergeVNode(tag.map(normalizeVNode), props))
  }
  return createText(tag as TextContent)
}

export function createElement(
  tag: string,
  props?: Partial<VNodeProps>,
  children?: VNodeChildren
): VNode {
  const key = props ? props.key : null
  return {
    type: Element,
    nodeType: NodeType.Element,
    key: key,
    flag: Gyron,
    tag: tag,
    props: props,
    children: children,
  }
}

export function createComponent(
  componentFunction: ComponentSetupFunction,
  props?: Partial<VNodeProps>,
  children?: VNodeChildren
): VNode<ComponentSetupFunction> {
  const key = props ? props.key : null
  return {
    type: componentFunction,
    nodeType: NodeType.Component,
    key: key,
    flag: Gyron,
    props: omit(props, 'key'),
    children: children,
  }
}

export function createFragment(children: Children[]): VNode<typeof Fragment> {
  return {
    type: Fragment,
    nodeType: NodeType.Fragment,
    children: children,
    props: {},
    flag: Gyron,
  }
}

export function createText(children: TextContent): VNode<typeof Text> {
  return {
    type: Text,
    nodeType: NodeType.Text,
    children: children,
    props: {},
    flag: Gyron,
  }
}

export function createComment(children?: string): VNode<typeof Comment> {
  return {
    type: Comment,
    nodeType: NodeType.Comment,
    children: children,
    props: {},
    flag: Gyron,
  }
}

export function normalizeVNode(child: VNodeChildren): VNode {
  if (isVNode(child)) {
    return child
  }
  if (child == null || typeof child === 'boolean') {
    return createComment()
  } else if (Array.isArray(child)) {
    return createFragment(child.slice() as VNode[])
  } else {
    return createText(String(child))
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

  return children.map((node) => normalizeVNodeWithLink(node, parent))
}

export function normalizeVNodeWithLink(children: Children, parent: VNode) {
  const node = normalizeVNode(children)
  node.parent = parent
  return node
}
