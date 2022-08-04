import { isString } from '@gyron/shared'
import { querySelector } from '@gyron/dom-client'
import { patch, unmount } from './renderer'
import { hydrate } from './hydrate'
import { checkVersion } from './version'
import type { VNode, Context } from './vnode'

export interface Instance {
  container: Element | null
  render: (containerOrSelector: string | HTMLElement) => Instance
  destroy: () => Instance
}

export function createContext() {
  const _context = new Map()
  const context: Context = {
    set(k, v) {
      return _context.set(k, v)
    },
    get(k) {
      return _context.get(k)
    },
    keys() {
      return _context.keys()
    },
    values() {
      return _context.values()
    },
    clear() {
      return _context.clear()
    },
  }
  return context
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

      if (isHydrate) {
        hydrate(instance.container.firstChild, root)
        return instance
      }
      instance.container.innerHTML = ''
      render(root, instance.container)
      return instance
    },
    destroy() {
      if (instance.container) {
        unmount(root)
        instance.container.innerHTML = ''
      }
      return instance
    },
  }

  return instance
}
