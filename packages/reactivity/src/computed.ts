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
 * 类似于 javascript 中的访问器属性，但是其依赖的数据的变动会自动触发依赖 useComputed 的数据变更。
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
 * @param getter 读取数据的函数
 * @param setter 设置数据的函数
 * @param dependency 依赖的数组函数，每一个函数的返回值是需要依赖的对象。
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
 * 如果依赖的数据没有更新，则值将不会得到更新。为了避免这种情况，需要使用 useComputed 对数据进行处理。
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
 * @param getter 读取数据的函数
 * @param setter 设置数据的函数
 * @param dependency 依赖的数组函数，每一个函数的返回值是需要依赖的对象。
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
