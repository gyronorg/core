import { createText, insert } from '@gyron/dom-client'
import { VNode, RenderElement, Component, normalizeChildrenVNode } from '..'
import { patchChildren } from './element'
import { mountChildren } from './shared'

export function enterFragment(
  n1: VNode | null,
  n2: VNode,
  container: RenderElement,
  anchor: RenderElement,
  parentComponent: Component,
  isSvg: boolean
) {
  const fragmentEndAnchor = (n2.anchor = n1 ? n1.anchor : createText(''))
  if (n1 === null) {
    n2.anchor = fragmentEndAnchor
    insert(fragmentEndAnchor, container, anchor)

    n2.children = normalizeChildrenVNode(n2)
    mountChildren(
      n2.children,
      container,
      fragmentEndAnchor,
      0,
      parentComponent,
      isSvg
    )
  } else {
    patchChildren(n1, n2, container, fragmentEndAnchor, parentComponent, isSvg)
  }
}
