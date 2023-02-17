import {
  createElement,
  insert,
  isSelectElement,
  mountProps,
  patchProps,
} from '@gyron/dom-client'
import {
  shouldValue,
  keys,
  extend,
  isEqual,
  isArray,
  isFunction,
  isObject,
} from '@gyron/shared'
import { isVNodeComponent } from '..'
import { Component, removeBuiltInProps } from '../component'
import { setRef } from '../ref'
import { patch } from '.'
import {
  mergeVNodeWith,
  normalizeChildrenVNode,
  RenderElement,
  VNode,
} from '../vnode'
import { patchComponent } from './component'
import {
  getNextSibling,
  mountChildren,
  unmount,
  unmountChildren,
} from './shared'

function transitionMove(
  n1: VNode,
  n2: VNode,
  container: RenderElement,
  anchor: RenderElement,
  parentComponent: Component,
  isSvg: boolean
) {
  const { transition } = n1
  const el = n1.el as Element
  transition.onLeaveFinish(el)
  unmount(n1)
  patch(
    null,
    n2,
    container,
    anchor || getNextSibling(n1),
    parentComponent,
    isSvg
  )
}

function mountElement(
  vnode: VNode,
  container: RenderElement,
  anchor: RenderElement,
  parentComponent: Component,
  isSvg: boolean
) {
  const { tag, is, transition } = vnode
  const el = (vnode.el = createElement(tag, isSvg, is) as RenderElement)
  el.__vnode__ = vnode

  if (vnode.props.ref) {
    setRef(el, vnode.props.ref)
  }

  const props = removeBuiltInProps(vnode.props)
  if (shouldValue(keys(props))) {
    mountProps(el as HTMLElement, extend({}, vnode, { props: props }))
  }

  if (shouldValue(vnode.children)) {
    vnode.children = normalizeChildrenVNode(vnode)
    mountChildren(vnode.children, vnode.el, anchor, 0, parentComponent, isSvg)
  }

  insert(el, container, anchor)

  if (transition) {
    transition.onActive(el as Element)
  }
}

function isKeyPatch(n1: VNode[], n2: VNode[]) {
  if (n1 && n2 && n1[0] && n2[0] && isObject(n1[0]) && isObject(n2[0])) {
    return shouldValue(n1[0].key) && shouldValue(n2[0].key)
  }
  return false
}

function patchKeyed(
  c1: VNode[],
  c2: VNode[],
  container: RenderElement,
  anchor: RenderElement | null,
  parentComponent: Component | null,
  isSvg: boolean
) {
  const o1: Record<
    string | symbol,
    VNode & { index: number; inserted: boolean }
  > = c1.reduce((nodeMap, node, index) => {
    nodeMap[node.key] = extend(node, { index })
    return nodeMap
  }, {})

  const e2 = c2.length
  let i = 0
  while (i < e2) {
    const c2n = c2[i]
    const c1n = o1[c2n.key]
    if (c1n) {
      // 1, find the same key value of the node, and then inserted into the corresponding location. (Do not delete add, move directly)
      const el = mergeVNodeWith(c2n, c1n).el
      if (c1n.index !== i) {
        // insert to new position when node order is changed
        const anchor = container.childNodes[i]
        if (el !== anchor.nextSibling) {
          insert(el, container, anchor.nextSibling)
        }
      }
      // update props after migration is complete
      // element update attribute
      if (!isEqual(c1n.props, c2n.props)) {
        const isComponent = isVNodeComponent(c2n) && isVNodeComponent(c1n)
        if (isComponent) {
          patchComponent(c1n, c2n, container, anchor, parentComponent)
        } else {
          patchProps(
            el as HTMLElement,
            c1n,
            extend({}, c2n, { props: removeBuiltInProps(c2n.props) })
          )
        }
      }
      // 1, end

      if (c1n.children || c2n.children) {
        // 2, update the nodes with the same key value, including the child nodes.
        // sub-level nodes need to be patched again
        patchChildren(c1n, c2n, container, anchor, parentComponent, isSvg)
        // 2, end
      }

      // mark nodes that have been moved and do not need to be uninstalled in the third step
      c1n.inserted = true
    } else {
      patch(null, c2n, container, anchor, parentComponent, isSvg)
    }
    i++
  }

  for (const node of Object.values(o1)) {
    if (!node.inserted) {
      // 3, uninstall the old nodes that are not used.
      unmount(node)
      // 3, end
    }
  }
}

function patchNonKeyed(
  c1: VNode[],
  c2: VNode[],
  container: RenderElement,
  anchor: RenderElement,
  parentComponent: Component,
  isSvg: boolean
) {
  const c1length = c1.length
  const c2length = c2.length
  const minLength = Math.min(c1length, c2length)
  for (let i = 0; i < minLength; i++) {
    const prevChild = c1[i]
    const nextChild = c2[i]
    patch(prevChild, nextChild, container, anchor, parentComponent)
  }
  if (c1length > c2length) {
    unmountChildren(c1, minLength)
  } else {
    mountChildren(c2, container, anchor, minLength, parentComponent, isSvg)
  }
}

export function patchChildren(
  n1: VNode,
  n2: VNode,
  container: RenderElement,
  anchor: RenderElement,
  parentComponent: Component,
  isSvg: boolean
) {
  if (isFunction(n1.children) && isFunction(n2.children)) {
    // when the child nodes are all functions, they should be called by the parent node.
    // <Parent>{count => <Title count={count} />}</Parent>
    return
  }

  const c1memo = n1.props.memo
  const c2memo = n2.props.memo
  if (isArray(c1memo) && isArray(c2memo)) {
    const index = c1memo.findIndex((item, index) => {
      return c2memo[index] !== item
    })
    if (index < 0) {
      n2.children = n1.children
      return
    }
  }

  const c1 = n1.children as VNode[]
  const c2: VNode[] = (n2.children = normalizeChildrenVNode(n2))

  if (c1?.length || c2?.length) {
    if (isKeyPatch(c1, c2)) {
      const el = (n2.el = n1.el)
      patchKeyed(c1, c2, el || container, anchor, parentComponent, isSvg)
    } else {
      // if the fragment node does not have a dom instance, use the container
      const el = (n2.el = n1.el)
      if (c1) {
        patchNonKeyed(c1, c2, el || container, anchor, parentComponent, isSvg)
      } else {
        mountChildren(c2, el || container, anchor, 0, parentComponent, isSvg)
      }
    }
  }
}

function patchElement(
  n1: VNode,
  n2: VNode,
  container: RenderElement,
  anchor: RenderElement,
  parentComponent: Component,
  isSvg: boolean
) {
  const el = (n2.el = n1.el) as Element
  if (el.nodeName === n2.tag.toLocaleUpperCase()) {
    if (!isEqual(n1.props, n2.props) || isSelectElement(n2)) {
      patchProps(
        el,
        n1,
        extend({}, n2, { props: removeBuiltInProps(n2.props) })
      )
    }
    if (n1.children || n2.children) {
      patchChildren(n1, n2, container, anchor, parentComponent, isSvg)
    }
  } else {
    anchor = getNextSibling(n1)
    unmount(n1)
    patch(null, n2, container, anchor, parentComponent, isSvg)
  }
}

export function enterElement(
  n1: VNode | null,
  n2: VNode,
  container: RenderElement,
  anchor: RenderElement,
  parentComponent: Component,
  isSvg: boolean
) {
  isSvg = isSvg || n2.tag === 'svg'

  if (n1 === null) {
    mountElement(n2, container, anchor, parentComponent, isSvg)
  } else if (!n2.props.static) {
    if (n1.transition) {
      transitionMove(n1, n2, container, anchor, parentComponent, isSvg)
    } else {
      patchElement(n1, n2, container, anchor, parentComponent, isSvg)
    }
  }
}
