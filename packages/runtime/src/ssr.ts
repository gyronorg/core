import { extend } from '@gyron/shared'
import { createInstance, Instance } from './instance'
import { VNode } from './vnode'

/**
 * 创建服务端应用。服务端应用中所有组件的参数`isSSR`始终为 true。
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
