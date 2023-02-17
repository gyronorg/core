import { createText, insert } from '@gyron/dom-client'
import { RenderElement, VNode } from '../vnode'

export function enterText(
  n1: VNode | null,
  n2: VNode,
  container: RenderElement,
  anchor: RenderElement
) {
  if (n1 === null || !n1.el) {
    // when hydrating the code, since there is no empty text node on the server side, you need to execute mountText
    const textNode = createText(n2.children as string) as RenderElement

    textNode.__vnode__ = n2
    n2.el = textNode

    insert(textNode, container, anchor)
  } else {
    const el = (n2.el = n1.el)

    const c1 = '' + n1.children
    const c2 = '' + n2.children

    if (c1 !== c2) {
      el.textContent = c2
    }
  }
}
