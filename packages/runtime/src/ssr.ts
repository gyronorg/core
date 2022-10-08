import { extend } from '@gyron/shared'
import { createInstance, Instance } from './instance'
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
 * @param vnode VNode object
 * @returns return SSRInstance object
 */
export function createSSRInstance(vnode: VNode): SSRInstance {
  const ssr = createInstance(vnode, true)
  return extend(ssr, { root: vnode })
}

export interface SSRContext {
  message: {
    uri: string
    props: Record<string, object>
  }[]
}

export function createSSRContext(context: SSRContext) {
  return context
}
