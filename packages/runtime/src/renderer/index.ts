import { unmount, getNextSibling } from './shared'
import { enterText } from './text'
import { enterFragment } from './fragment'
import { enterElement } from './element'
import { enterComment } from './comment'
import { enterComponent, mountComponent } from './component'
import {
  VNode,
  RenderElement,
  Fragment,
  Text,
  Comment,
  Element,
} from '../vnode'
import { Component, ComponentSetupFunction } from '../component'

export { unmount, mountComponent }

export function isSameVNodeType(n1: VNode, n2: VNode) {
  return n1.type === n2.type && n1.key === n2.key
}

export function patch(
  n1: VNode | null,
  n2: VNode,
  container: RenderElement,
  anchor: RenderElement | null = null,
  parentComponent: Component | null = null,
  isSvg = false
) {
  if (!container) {
    throw new Error(
      'The parent element is not found when updating, please check the code.'
    )
  }

  if (n1 && !isSameVNodeType(n1, n2)) {
    anchor = getNextSibling(n1)
    unmount(n1)
    n1 = null
  }

  switch (n2.type) {
    case Text:
      enterText(n1, n2, container, anchor)
      break
    case Comment:
      enterComment(n1, n2, container, anchor)
      break
    case Element:
      enterElement(n1, n2, container, anchor, parentComponent, isSvg)
      break
    case Fragment:
      enterFragment(n1, n2, container, anchor, parentComponent, isSvg)
      break
    default:
      enterComponent(
        n1 as VNode<ComponentSetupFunction>,
        n2 as VNode<ComponentSetupFunction>,
        container,
        anchor,
        parentComponent
      )
  }
}
