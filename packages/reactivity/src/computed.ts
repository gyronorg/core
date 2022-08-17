import { isArray, isFunction, isUndefined, noop } from '@gyron/shared'
import {
  Dep,
  Dependency,
  Effect,
  enableTrack,
  pauseTrack,
  createEffect,
  trackEffect,
  triggerEffect,
} from './effect'
import { ReactiveFlags } from './reactive'

export class Computed<T = any> {
  private _effect: Effect
  private _value!: T
  private _lazy = true
  public dep: Dep | undefined

  public [ReactiveFlags.IS_COMPUTED] = true

  constructor(
    private getter: () => T,
    private setter: (v: T) => void,
    private dependency: Dependency[] = [],
    private memo = false
  ) {
    this._effect = createEffect(
      this.getter,
      () => {
        if (this.memo) {
          if (!this._lazy) {
            this._lazy = true
            triggerEffect(this.dep)
          }
        } else {
          triggerEffect(this.dep)
        }
      },
      this.dependency
    )
  }

  get value() {
    trackEffect(this.dep || (this.dep = new Set()))
    if (this.memo) {
      if (this._lazy) {
        this._lazy = false
        this._value = this._effect.run()
      }
    } else {
      this._value = this._effect.run()
    }
    return this._value
  }

  set value(v) {
    this.setter(v)
  }

  get [ReactiveFlags.RAW]() {
    try {
      pauseTrack()
      return this._effect.run()
    } finally {
      enableTrack()
    }
  }
}

function wrapperComputed<T>(
  getter: () => T,
  unstable: ((value: T) => void) | Dependency[],
  dependency: Dependency[],
  memo: boolean
) {
  let setter: (value: T) => void
  if (isFunction(unstable)) {
    setter = unstable
  } else if (isUndefined(unstable)) {
    setter = noop
  } else if (isArray(unstable)) {
    dependency = unstable
    setter = noop
  }
  return new Computed<T>(getter, setter, dependency, memo)
}

/**
 * Similar to the accessor property in javascript,
 * but changes to the data it depends on will automatically trigger changes to the data that depends on useComputed.
 * ```js
 * import { useValue, useComputed } from 'gyron'
 *
 * const original = useValue(0)
 * const observed = useComputed(() => {
 *   return original.value + 1
 * })
 * original.value = 10
 * observed.value === 11 // true
 * ```
 * @api reactivity
 * @param getter Functions for reading data
 * @param setter Functions for setting data
 * @param dependency Dependent array functions, where the return value of each function is the object to be dependent on.
 */
export function useComputed<T>(getter: () => T): Computed<T>
export function useComputed<T>(
  getter: () => T,
  dependency: Dependency[]
): Computed<T>
export function useComputed<T>(
  getter: () => T,
  setter: (value: T) => void,
  dependency: Dependency[]
): Computed<T>
export function useComputed(getter: any, unstable?: any, dependency?: any) {
  return wrapperComputed(getter, unstable, dependency, false)
}

/**
 * If the dependent data is not updated, the value will not be updated.
 * To avoid this, the data needs to be processed using `useComputed`.
 * ```js
 * import { useValue, useMemo } from 'gyron'
 *
 * const original = useValue(0)
 * const memo = useMemo(() => {
 *   return Date.now() + original.value
 * })
 * memo.value === memo.value // true
 * ```
 * @api reactivity
 * @param getter Functions for reading data.
 * @param setter Functions for setting data.
 * @param dependency Dependent array functions, where the return value of each function is the object to be dependent on.
 */
export function useMemo<T>(getter: () => T): Computed<T>
export function useMemo<T>(
  getter: () => T,
  dependency: Dependency[]
): Computed<T>
export function useMemo<T>(
  getter: () => T,
  setter: (value: T) => void,
  dependency: Dependency[]
): Computed<T>
export function useMemo(getter: any, unstable?: any, dependency?: any) {
  return wrapperComputed(getter, unstable, dependency, true)
}
