import { merge, extend, isPlanObject, isString } from '@gyron/shared'
import { isVNode } from './shared'
import {
  VNodeChildren,
  createVNode,
  VNode,
  VNodeProps,
  VNodeType,
} from './vnode'
import { UtilComponentProps } from './component'

export type HProps = VNodeProps | string

/**
 * Creates a `VNode` node with a normal object return value.
 * Can be run directly in the browser and is mainly used to write applications in non-compiled environments.
 * ```js
 * import { h } from 'gyron'
 *
 * const App = h(() => {
 *   return h('div', 'hello world')
 * })
 * ```
 * @api global
 * @param type The type of node to be created, either a tag name or a function.
 * @param props Can be a string or an object, if it is a string it will be treated as `children`.
 * @param children A child node, either a VNode node or a string.
 * @returns VNode
 */
export function h<T extends VNodeType>(
  type: T,
  props?: UtilComponentProps<T, HProps>,
  children?: VNodeChildren
): VNode {
  if (!type) return

  if (isString(props)) {
    // h('div', 'hello world')
    children = props
    props = null
  }

  if (isVNode(type)) {
    if (isPlanObject(props)) {
      extend((type.props = type.props || {}), props)
    }
    type.children = merge<VNodeChildren>(type.children, children)
    return type
  }

  return createVNode(type, props as VNodeProps, children)
}
