import {
  Children,
  createVNode,
  VNode,
  VNodeProps,
  VNodeType,
  Fragment,
  h as H,
} from '@gyron/runtime'
import { isUndefined, omit } from '@gyron/shared'

export { Fragment } from '@gyron/runtime'

/**
 * Adaptation of all built-in jsx supported conversion functions
 */
export function h(
  type: VNodeType,
  props: Partial<VNodeProps>,
  ...children: Children[]
) {
  if (type === Fragment) {
    return createVNode(children as VNode[])
  }

  return H(
    type,
    props,
    children.filter((item) => !isUndefined(item))
  )
}

export function jsx(
  type: VNodeType,
  props: Partial<VNodeProps & { children: Children }>
) {
  return h(type, omit(props, 'children'), props.children)
}

export function jsxs(
  type: VNodeType,
  props: Partial<VNodeProps & { children: Children[] }>
) {
  const children = props.children
  return h(type, omit(props, 'children'), ...children)
}
