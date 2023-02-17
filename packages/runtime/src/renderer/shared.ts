import { isArray, isElement, Noop } from '@gyron/shared'
import { isVNode } from '../shared'
import { Component, isCacheComponent } from '../component'
import { invokeLifecycle } from '../lifecycle'
import { Children, normalizeVNode, RenderElement, VNode } from '../vnode'
import { nextSibling, remove } from '@gyron/dom-client'
import { patch } from '.'

function removeInvoke(_el: RenderElement, vnode: VNode, done: Noop) {
  const { transition } = vnode
  const el = _el as Element
  if (transition) {
    transition.onLeave(el, () => {
      remove(el)
      done()
    })
  } else {
    remove(el)
    done()
  }
}

export function unmountChildren(c1: VNode[], start = 0) {
  for (let i = start; i < c1.length; i++) {
    unmount(c1[i])
  }
}

export function mountChildren(
  nodes: VNode[] | Children[],
  container: RenderElement,
  anchor: RenderElement,
  start = 0,
  parentComponent: Component | null = null,
  isSvg: boolean
) {
  for (let i = start; i < nodes.length; i++) {
    const node = normalizeVNode(nodes[i])
    patch(null, node, container, anchor, parentComponent, isSvg)
  }
}

export function getNextSibling(vnode: VNode) {
  if (vnode.component) {
    return getNextSibling(vnode.component.subTree)
  }
  if (vnode.el || vnode.anchor) {
    return nextSibling(vnode.el || vnode.anchor)
  }
  return null
}

export function unmount(vnode: VNode) {
  if (!isVNode(vnode)) {
    return null
  }

  function reset() {
    vnode.el = null
  }
  const { el, component, children, transition } = vnode

  if (component) {
    if (!isCacheComponent(component.type)) {
      component.effect.stop()
    }
    if (component.subTree) {
      unmount(component.subTree)
    }
    invokeLifecycle(component, 'destroyed')
    if (component.$el) {
      removeInvoke(component.$el, vnode, reset)
      if (!isCacheComponent(component.type)) {
        component.$el = null
      }
    }
    component.destroyed = true
    component.mounted = false
  } else {
    if (!transition) {
      if (isArray(children) && children.length > 0) {
        unmountChildren(children as VNode[])
      } else {
        unmount(children as VNode)
      }
    }
    if (isElement(el)) {
      removeInvoke(el, vnode, reset)
    }
  }
}
