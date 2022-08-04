import { Exposed } from './component'
import { RenderElement } from './vnode'

export type Ref = null | Exposed | RenderElement
export interface UserRef<T = Ref> {
  current: T
}

export function useRef<T = any>(initialValue?: T): UserRef<T> {
  return {
    current: initialValue,
  }
}

export function setRef(ref: Ref, userRef: UserRef) {
  userRef.current = ref
}
