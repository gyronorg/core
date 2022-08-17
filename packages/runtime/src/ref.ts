import { Exposed } from './component'
import { RenderElement } from './vnode'

export type Ref = null | Exposed | RenderElement
export interface UserRef<T = Ref> {
  current: T
}

/**
 * creates a `ref` object that can be bound to a `vnode` node. If the bound node is a normal node, its value is `Node`.
 * If it is a component, the value is the object exposed by the component.
 * A default value can be passed, `current` is the default value when the value is not bound.
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
 * @param initialValue initial value.
 */
export function createRef<T = any>(initialValue?: T): UserRef<T> {
  return {
    current: initialValue,
  }
}

export function setRef(ref: Ref, userRef: UserRef) {
  userRef.current = ref
}
