import { hasChanged, hasOwn, isMap, Noop } from '@gyron/shared'
import {
  ITERATE_KEY,
  MAP_KEY_ITERATE_KEY,
  track,
  TrackTypes,
  trigger,
  TriggerTypes,
} from './effect'
import { ReactiveFlags, toRaw } from './reactive'

export type CollectionTypes = IterableCollections | WeakCollections

type IterableCollections = Map<any, any> | Set<any>
type WeakCollections = WeakMap<any, any> | WeakSet<any>
type MapTypes = Map<any, any> | WeakMap<any, any>
type SetTypes = Set<any> | WeakSet<any>

interface Iterable {
  [Symbol.iterator](): Iterator
}

interface Iterator {
  next(value?: any): IterationResult
}

interface IterationResult {
  value: any
  done: boolean
}

const getProto = <T extends CollectionTypes>(v: T): any =>
  Reflect.getPrototypeOf(v)

function get(target: MapTypes, key: unknown) {
  target = (target as any)[ReactiveFlags.RAW]
  const rawTarget = toRaw(target)
  const rawKey = toRaw(key)
  if (key !== rawKey) {
    track(rawTarget, key, TrackTypes.GET)
  }
  track(rawTarget, rawKey, TrackTypes.GET)
  const { has } = getProto(rawTarget)
  if (has.call(rawTarget, key)) {
    return target.get(key)
  } else if (has.call(rawTarget, rawKey)) {
    return target.get(rawKey)
  } else if (target !== rawTarget) {
    target.get(key)
  }
}

function add(this: SetTypes, value: unknown) {
  value = toRaw(value)
  const target = toRaw(this)
  const proto = getProto(target)
  const hadKey = proto.has.call(target, value)
  if (!hadKey) {
    target.add(value)
    trigger(target, value, TriggerTypes.ADD)
  }
  return this
}

function has(this: CollectionTypes, key: unknown): boolean {
  const target = (this as any)[ReactiveFlags.RAW]
  const rawTarget = toRaw(target)
  const rawKey = toRaw(key)
  if (key !== rawKey) {
    track(rawTarget, key, TrackTypes.HAS)
  }
  track(rawTarget, rawKey, TrackTypes.HAS)
  return key === rawKey
    ? target.has(key)
    : target.has(key) || target.has(rawKey)
}

function size(target: IterableCollections) {
  target = (target as any)[ReactiveFlags.RAW]
  track(toRaw(target), ITERATE_KEY, TrackTypes.ITERATE)
  return Reflect.get(target, 'size', target)
}

function set(this: MapTypes, key: unknown, value: unknown) {
  value = toRaw(value)
  const target = toRaw(this)
  const { has, get } = getProto(target)

  let hadKey = has.call(target, key)
  if (!hadKey) {
    key = toRaw(key)
    hadKey = has.call(target, key)
  }

  const oldValue = get.call(target, key)
  target.set(key, value)
  if (!hadKey) {
    trigger(target, key, TriggerTypes.ADD, value)
  } else if (hasChanged(value, oldValue)) {
    trigger(target, key, TriggerTypes.SET, value)
  }
  return this
}

function deleteEntry(this: CollectionTypes, key: unknown) {
  const target = toRaw(this)
  const { has } = getProto(target)
  let hadKey = has.call(target, key)
  if (!hadKey) {
    key = toRaw(key)
    hadKey = has.call(target, key)
  }
  const result = target.delete(key)
  if (hadKey) {
    trigger(target, key, TriggerTypes.DELETE)
  }
  return result
}

function clear(this: IterableCollections) {
  const target = toRaw(this)
  const hadItems = target.size !== 0
  const result = target.clear()
  if (hadItems) {
    trigger(target, undefined, TriggerTypes.CLEAR)
  }
  return result
}

function createForEach() {
  return function forEach(
    this: IterableCollections,
    callback: Noop,
    thisArg?: unknown
  ) {
    const observed = this as any
    const target = observed[ReactiveFlags.RAW]
    const rawTarget = toRaw(target)
    track(rawTarget, ITERATE_KEY, TrackTypes.ITERATE)
    return target.forEach((value: unknown, key: unknown) => {
      return callback.call(thisArg, value, key, observed)
    })
  }
}

function createIterableMethod(method: string | symbol) {
  return function (
    this: IterableCollections,
    ...args: unknown[]
  ): Iterable & Iterator {
    const target = (this as any)[ReactiveFlags.RAW]
    const rawTarget = toRaw(target)
    const targetIsMap = isMap(rawTarget)
    const isPair =
      method === 'entries' || (method === Symbol.iterator && targetIsMap)
    const isKeyOnly = method === 'keys' && targetIsMap
    const innerIterator = target[method](...args)
    track(
      rawTarget,
      isKeyOnly ? MAP_KEY_ITERATE_KEY : ITERATE_KEY,
      TrackTypes.ITERATE
    )
    // return a wrapped iterator which returns observed versions of the
    // values emitted from the real iterator
    return {
      next() {
        const { value, done } = innerIterator.next()
        return done
          ? { value, done }
          : {
              value: isPair ? [value[0], value[1]] : value,
              done,
            }
      },
      [Symbol.iterator]() {
        return this
      },
    }
  }
}

export const collectionHandlers: ProxyHandler<object> = {
  get: (
    target: CollectionTypes,
    key: string | symbol,
    receiver: CollectionTypes
  ) => {
    const collections = {
      get size() {
        return size(this as unknown as IterableCollections)
      },
      get(this: MapTypes, key: unknown) {
        return get(this, key)
      },
      has,
      add,
      set,
      delete: deleteEntry,
      clear,
      forEach: createForEach(),
      keys: createIterableMethod('keys'),
      values: createIterableMethod('values'),
      entries: createIterableMethod('entries'),
      [Symbol.iterator]: createIterableMethod(Symbol.iterator),
    }
    if (key === ReactiveFlags.RAW) {
      return target
    }
    return Reflect.get(
      hasOwn(collections, key) && key in target ? collections : target,
      key,
      receiver
    )
  },
}
