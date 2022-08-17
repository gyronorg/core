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
 * 创建一个 VNode 节点，返回值为一个普通的对象。可以直接运行在浏览器，主要用来在非编译环境下编写应用。
 * ```js
 * import { h } from 'gyron'
 *
 * const App = h(() => {
 *   return h('div', 'hello world')
 * })
 * ```
 * @api global
 * @param type 要创建的节点类型，可以是标签名或者一个函数。
 * @param props 可以是字符串或者对象，如果是字符串则会当作`children`
 * @param children 子节点，可以是 VNode 节点或者字符串。
 * @returns VNode
 */
export function h<T extends VNodeType>(
  type: T,
  props?: UtilComponentProps<T, HProps>,
  children?: VNodeChildren
): VNode {
  if (!type) return

  if (isString(props)) {
    /**
     * h('div', 'hello world')
     */
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
