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

/**
 * 渲染虚拟节点到真实的DOM上。
 * ```js
 * import { render, h } from 'gyron'
 *
 * render(h('div', { id: 'gyron' }), document.body)
 * ```
 * @api global
 * @param vnode 虚拟节点
 * @param container 浏览器中的节点
 */
export function render(vnode: VNode, container: Element) {
  patch(null, vnode, container)
}

/**
 * 创建应用，并通过应用上的`render`方法渲染成实际的 DOM 节点。
 * ```js
 * import { h, createInstance } from 'gyron'
 *
 * const App = h(() => {
 *   return h('div', 'hello world')
 * })
 *
 * createInstance(h(App)).render('#root')
 * ```
 * @api global
 * @param root 一个 VNode 节点，可以通过 h 函数创建
 * @param isHydrate 用于服务端渲染参数，为 Truthy 则代表使用“水合”方法让界面变得可响应
 * @returns 应用实例
 */
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
