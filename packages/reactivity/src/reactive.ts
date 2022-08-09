import {
  hasChanged,
  hasOwn,
  isArray,
  isCollection,
  isObject,
  isReadonly,
  isUndefined,
  objectReadonlyReducer,
} from '@gyron/shared'
import { collectionHandlers, CollectionTypes } from './collection'
import { Computed } from './computed'
import {
  pauseTrack,
  enableTrack,
  track,
  TrackTypes,
  trigger,
  TriggerTypes,
  ITERATE_KEY,
} from './effect'
import { Primitive } from './primitive'

export type ReactValue<T> = Primitive<T> | Computed<T>

export type RawValue<T> = T extends ReactValue<infer V> ? V : T

export const reactiveMap = new WeakMap<object | CollectionTypes, any>()

export const enum ReactiveFlags {
  IS_REACTIVE = '_reactive_',
  IS_COMPUTED = '_computed_',
  IS_PRIMITIVE = '_primitive_',
  IS_READONLY = '_readonly_',
  RAW = '_raw_',
  RAW_VALUE = '_raw_value_',
}

export interface Target {
  [ReactiveFlags.IS_REACTIVE]?: boolean
  [ReactiveFlags.IS_COMPUTED]?: boolean
  [ReactiveFlags.IS_PRIMITIVE]?: boolean
  [ReactiveFlags.IS_READONLY]?: boolean
  [ReactiveFlags.RAW]?: any
}

export function isResponsive(n: any): n is { value: any } {
  // reactivity/src/useReactive ReactiveFlags
  return (
    isObject(n) &&
    Boolean(
      n[ReactiveFlags.IS_REACTIVE] ||
        n[ReactiveFlags.IS_COMPUTED] ||
        n[ReactiveFlags.IS_PRIMITIVE]
    )
  )
}

export function toRaw<T>(observed: T): RawValue<T> {
  const raw = !isUndefined(observed) && (observed as Target)[ReactiveFlags.RAW]
  if (!isUndefined(raw)) {
    return toRaw(raw)
  }
  return observed as RawValue<T>
}

const arrayInstrumentations = createArrayInstrumentations()

function createArrayInstrumentations() {
  const instrumentations: Record<string, () => any> = {}
  ;(['includes', 'indexOf', 'lastIndexOf'] as const).forEach((key) => {
    instrumentations[key] = function (this: unknown[], ...args: unknown[]) {
      const arr = toRaw(this) as any
      for (let i = 0, l = this.length; i < l; i++) {
        track(arr, i + '', TrackTypes.GET)
      }
      // we run the method using the original args first (which may be useReactive)
      const res = arr[key](...args)
      if (res === -1 || res === false) {
        // if that didn't work, run it again using raw values.
        return arr[key](...args.map(toRaw))
      } else {
        return res
      }
    }
  })
  ;(['push', 'pop', 'shift', 'unshift', 'splice'] as const).forEach((key) => {
    instrumentations[key] = function (this: any, ...args: unknown[]) {
      pauseTrack()
      const res = (this[ReactiveFlags.RAW] as any)[key].apply(this, args)
      enableTrack()
      return res
    }
  })
  return instrumentations
}

function get(target: object, key: string | symbol, receiver: object) {
  if (key === ReactiveFlags.IS_REACTIVE) {
    return true
  }
  if (key === ReactiveFlags.RAW) {
    return target
  }

  const targetIsArray = Array.isArray(target)

  if (targetIsArray) {
    if (hasOwn(arrayInstrumentations, key)) {
      // skip listening to the array's built-in methods, which access the array's length, and just listen to the length.
      return Reflect.get(arrayInstrumentations, key, receiver)
    }
  }

  const res = Reflect.get(target, key, receiver)

  track(target, key, TrackTypes.GET)

  if (res && typeof res === 'object') {
    // deep useReactive
    return useReactive(res)
  }

  return res
}

function set(
  target: object,
  key: string | symbol,
  value: unknown,
  receiver: object
) {
  if (isReadonly(target, key)) {
    return false
  }

  const oldValue = (target as any)[key]

  const res = Reflect.set(target, key, value, receiver)

  if (hasChanged(oldValue, value) || isArray(target)) {
    trigger(target, key, TriggerTypes.ADD)
  }

  return res
}

function has(target: object, key: string | symbol) {
  const res = Reflect.has(target, key)
  track(target, key, TrackTypes.HAS)
  return res
}

function deleteProperty(target: object, key: string | symbol) {
  if (isReadonly(target, key)) {
    return false
  }

  trigger(target, key, TriggerTypes.DELETE)

  return Reflect.deleteProperty(target, key)
}

function ownKeys(target: object) {
  const res = Reflect.ownKeys(target)
  track(target, isArray(target) ? 'length' : ITERATE_KEY, TrackTypes.ITERATE)
  return res
}

const mutableHandlers: ProxyHandler<object> = {
  get,
  set,
  has,
  deleteProperty,
  ownKeys,
}

export function useReactive<T extends object>(
  target: T,
  readonly?: boolean
): T {
  const existingProxy = reactiveMap.get(target)
  if (existingProxy) {
    return existingProxy
  }

  if (readonly) {
    objectReadonlyReducer(target, readonly)
  }

  const proxy = new Proxy<T>(
    target,
    isCollection(target) ? collectionHandlers : mutableHandlers
  )
  reactiveMap.set(target, proxy)

  return proxy
}
