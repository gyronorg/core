import { warn } from '@gyron/logger'
import { extend } from '@gyron/shared'
import { hydrate } from './hydrate'
import { createInstance, Instance } from './instance'
import { getUserContainer } from './shared'
import { VNode } from './vnode'

export interface SSRInstance extends Instance {
  root: VNode
}

/**
 * Create a server-side application. The parameter `isSSR` is always true for all components in the server-side application.
 * ```javascript
 * import { h, createSSRInstance, renderToString } from 'gyron'
 *
 * const App = h(() => {
 *   return h('div', 'hello world')
 * })
 *
 * const { root } = createSSRInstance(h(App))
 *
 * renderToString(root).then((html) => {
 *   console.log(html)
 *   // <div>hello world</div>
 * })
 * ```
 * @api global
 * @param vnode Virtual node
 * @returns return SSRInstance object
 * @deprecated createSSRInstance is deprecated and may be removed in a future version, please use createSSRContext instead
 */
export function createSSRInstance(vnode: VNode): SSRInstance {
  const ssr = createInstance(vnode, true)
  return extend(ssr, { root: vnode })
}

export interface SSRMessage {
  [key: string]: Record<string, any>
}

export interface SSRContext {
  message: SSRMessage
}

/**
 * When creating the server rendering context, you can obtain the props based on the component URI at the initial rendering to enable the client to hydrate.
 * @api global
 * @param context The initial state of the context
 * @returns Returns an object, including the render function for "hydrate"
 */
export function createSSRContext(context: SSRContext) {
  return {
    render: (vnode: VNode, containerOrSelector: string | HTMLElement) => {
      const container = getUserContainer(containerOrSelector)
      if (!container) {
        warn(
          'runtime',
          'Node not found in the document. The parameter is',
          containerOrSelector
        )
        return null
      }

      hydrate(container.firstChild, vnode, null, context.message)
      return vnode
    },
  }
}
