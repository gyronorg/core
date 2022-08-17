import { extend } from '@gyron/shared'
import { createInstance, Instance } from './instance'
import { VNode } from './vnode'

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
 * @param vnode
 * @returns
 */
export function createSSRInstance(vnode: VNode) {
  const ssr = createInstance(vnode, true)
  return extend<Instance & { root: VNode }>(ssr, { root: vnode })
}
