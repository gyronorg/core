import { extend } from '@gyron/shared'
import { createInstance, Instance } from './instance'
import { VNode } from './vnode'

export function createSSRInstance(vnode: VNode) {
  const ssr = createInstance(vnode, true)
  return extend<Instance & { root: VNode }>(ssr, { root: vnode })
}
