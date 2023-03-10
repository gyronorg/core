import type { RenderElement, VNode } from './vnode'
import { warn } from '@gyron/logger'
import { patch, unmount } from './renderer'
import { hydrate } from './hydrate'
import { getUserContainer } from './shared'

export interface Instance {
  container: Element | null
  render: (containerOrSelector: string | Element) => Instance
  destroy: () => Instance
}

export function createContext() {
  return new Map()
}

/**
 * Render virtual nodes to the real DOM.
 * ```js
 * import { render, h } from 'gyron'
 *
 * render(h('div', { id: 'gyron' }), document.body)
 * ```
 * @api global
 * @param vnode Virtual node
 * @param container Browser nodes
 */
export function render(vnode: VNode, container: Element) {
  patch(null, vnode, container)
}

/**
 * Create the application and render it as an actual DOM node via the `render` method on the application.
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
 * @param root A `VNode` node, which can be created with the `h` function.
 * @param isHydrate For server-side rendering parameters, `Truthy` means that the "hydration" method is used to make the interface responsive.
 * @returns Application examples.
 */
export function createInstance(root: VNode, isHydrate?: boolean) {
  const instance: Instance = {
    container: null,
    render(containerOrSelector) {
      instance.container = getUserContainer(containerOrSelector)

      if (!instance.container) {
        warn(
          'runtime',
          'Node not found in the document. The parameter is',
          containerOrSelector
        )
        return null
      }

      const firstChild = instance.container.firstChild
      // hydration application in ssr mode
      // or spa mode when reusing elements
      if (
        isHydrate ||
        (firstChild && (firstChild as RenderElement).__vnode__)
      ) {
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
