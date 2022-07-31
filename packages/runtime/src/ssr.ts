import { createInstance } from './instance'
import { VNode } from './vnode'

export function createSSRInstance(vnode: VNode) {
  return createInstance(vnode, true)
}
