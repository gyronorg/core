import { isString } from '@gyron/shared'
import { querySelector } from '@gyron/dom-client'
import { patch, unmount } from './render'
import { hydrate } from './hydrate'
import { checkVersion } from './version'
import type { RenderElement, VNode } from './vnode'

export interface Instance {
  container: Element | null
  render: (containerOrSelector: string | HTMLElement) => Instance
  destroy: () => Instance
}

export function createContext() {
  return new Map()
}

export function render(vnode: VNode, container: Element) {
  patch(null, vnode, container)
}

export function createInstance(root: VNode, isHydrate?: boolean) {
  checkVersion()

  const instance: Instance = {
    container: null,
    render(containerOrSelector) {
      if (containerOrSelector) {
        if (isString(containerOrSelector)) {
          instance.container = querySelector(containerOrSelector)
        } else {
          instance.container = containerOrSelector
        }
      }

      if (!instance.container) return null

      const firstChild = instance.container.firstChild
      if (isHydrate) {
        hydrate(firstChild, root)
        return instance
      }

      if (firstChild && (firstChild as RenderElement).__vnode__) {
        hydrate(firstChild, root)
        return instance
      }

      render(root, instance.container)
      return instance
    },
    destroy() {
      if (instance.container) {
        unmount(root)
      }
      return instance
    },
  }

  return instance
}
