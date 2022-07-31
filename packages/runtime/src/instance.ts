import { isString } from '@gyron/shared'
import { querySelector } from '@gyron/dom-client'
import { patch, unmount } from './renderer'
import { hydrate } from './hydrate'
import { installPlugin } from './plugin'
import { checkVersion } from './version'
import type { VNode, VNodeContext } from './vnode'
import type { Plugin } from './plugin'

export interface Instance {
  container: Element | null
  use: (plugin: Plugin) => Instance
  render: (containerOrSelector: string | HTMLElement) => Instance
  destroy: () => Instance
  readonly plugins: Set<Plugin>
  get root(): VNode
}

export function normalizeRootVNode(vnode: VNode) {
  vnode.root = vnode
  vnode.context = createContext()
}

export function createContext() {
  const _context = new Map()
  const context: VNodeContext = {
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
  }
  return context
}

export function render(vnode: VNode, container: Element) {
  patch(null, vnode, container)
}

export function createInstance(root: VNode, isHydrate?: boolean) {
  checkVersion()

  normalizeRootVNode(root)

  const instance: Instance = {
    container: null,
    plugins: new Set(),
    use(plugin) {
      installPlugin(plugin, instance, isHydrate)
      return instance
    },
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
    get root() {
      return root
    },
  }

  return instance
}
