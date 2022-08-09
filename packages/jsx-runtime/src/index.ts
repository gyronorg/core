import {
  Children,
  createFragment,
  VNode,
  VNodeProps,
  VNodeType,
  Fragment,
  h as H,
} from 'gyron'
import { isUndefined, omit } from '@gyron/shared'

export { Fragment } from 'gyron'

/**
 * Adaptation of all built-in jsx supported conversion functions
 */
export function h(
  type: VNodeType,
  props: Partial<VNodeProps>,
  ...children: Children[]
) {
  if (type === Fragment) {
    return createFragment(children as VNode[])
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
