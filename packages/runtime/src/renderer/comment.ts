import { createComment, insert } from '@gyron/dom-client'
import { RenderElement, VNode } from '../vnode'

export function enterComment(
  n1: VNode | null,
  n2: VNode,
  container: RenderElement,
  anchor: RenderElement
) {
  if (n1 === null) {
    const comment = createComment(
      (n2.children as string) || ''
    ) as RenderElement
    comment.__vnode__ = n2

    n2.el = comment as RenderElement
    insert(comment, container, anchor)
  } else {
    n2.el = n1.el
    n2.el.__vnode__ = n2
  }
}
