import { Exposed } from './component'
import { RenderElement } from './vnode'

export type Ref = null | Exposed | RenderElement
export interface UserRef<T = Ref> {
  current: T
}

/**
 * 创建一个 ref 对象，可以绑定到 vnode 节点上，如果绑定的节点是一个普通节点，其值就为 Node，
 * 如果是组件，其值就是组件暴露的对象。可以传递一个默认值，当值未绑定时 current 就是默认值。
 * ```javascript
 * import { h, createRef } from 'gyron'
 *
 * const App = h(() => {
 *   const myRef = createRef()
 *   return h('div', {
 *     ref: myRef,
 *   })
 * })
 * ```
 * @api global
 * @param initialValue 初始值
 */
export function createRef<T = any>(initialValue?: T): UserRef<T> {
  return {
    current: initialValue,
  }
}

export function setRef(ref: Ref, userRef: UserRef) {
  userRef.current = ref
}
