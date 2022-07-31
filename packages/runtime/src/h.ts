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
