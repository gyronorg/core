import { isArray, isIntegerKey, isMap } from '@gyron/shared'
import { ReactiveFlags } from './reactive'

let activeEffect: Effect | undefined

export const effectTracks = new WeakMap<any, Map<any, Dep>>()

export type Dep = Set<Effect>
export type EffectScheduler = (...args: any[]) => any

export interface EffectRunner<T = any> {
  (): T
  effect: Effect
}

export type Dependency = () => any

export type EffectFunction<T> = (...args: any) => T

export const enum TrackTypes {
  GET = 'get',
  HAS = 'has',
  ITERATE = 'iterate',
}

export const enum TriggerTypes {
  SET = 'set',
  ADD = 'add',
  DELETE = 'delete',
  CLEAR = 'clear',
}

export const ITERATE_KEY = Symbol.for('gyron.iterate')
export const MAP_KEY_ITERATE_KEY = Symbol.for('gyron.map-iterate')

let shouldTrack = true

export function pauseTrack() {
  shouldTrack = false
}

export function enableTrack() {
  shouldTrack = true
}

export function asyncTrackEffect(effect: Effect) {
  activeEffect = effect
}

export function clearTrackEffect() {
  activeEffect = undefined
}

export interface Effect {
  deps: Dep[]
  allowEffect: boolean
  scheduler: EffectScheduler | null
  wrapper: () => void
  run: () => any
  stop: () => void
}

export function createEffect(
  fn: () => void,
  scheduler: EffectScheduler | null = null,
  dependency: Dependency[] = []
) {
  let prevActiveEffect: Effect = null

  const effect: Effect = {
    deps: [],
    allowEffect: null,
    scheduler,
    run: () => {
      try {
        prevActiveEffect = activeEffect
        activeEffect = effect

        effect.wrapper()

        return fn()
      } finally {
        activeEffect = prevActiveEffect
        prevActiveEffect = null
      }
    },
    stop: () => {
      const { deps } = effect
      if (deps.length) {
        for (let i = 0; i < deps.length; i++) {
          deps[i].delete(effect)
        }
        deps.length = 0
      }
    },
    wrapper: () => {
      for (let i = 0; i < dependency.length; i++) {
        const fn = dependency[i]
        fn()
      }
    },
  }

  return effect
}

/**
 * The function will be called again when the data in the function body has changed,
 * so you can use this method to listen for a data change.
 * ```ts
 * import { useValue, useComputed } from 'gyron'
 *
 * const original = useValue(0)
 * let dummy: number
 * const s = useEffect(() => {
 *   dummy = original.value
 * })
 * original.value = 10
 * dummy === original.value // true
 * s.useEffect.stop()
 * original.value = 20
 * dummy === original.value // false
 * ```
 * @api reactivity
 * @param fn Callback function after data change.
 * @param dependency Dependent array functions, where the return value of each function is the object to be dependent on.
 * @returns Returns a function that can be called directly. The function will have an `effect` object attached to it and the `stop` method on the `effect` object can be accessed to stop listening to the data.
 */
export function useEffect<T = any>(
  fn: EffectFunction<T>,
  dependency?: Dependency[]
) {
  const effect = createEffect(fn, null, dependency)
  effect.run()
  const runner = effect.run.bind(effect) as EffectRunner<T>
  runner.effect = effect
  return runner
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function track(target: object, key: unknown, type: TrackTypes) {
  if (shouldTrack && activeEffect) {
    let targetTracks = effectTracks.get(target)
    if (!targetTracks) {
      effectTracks.set(target, (targetTracks = new Map()))
    }
    let targetDep = targetTracks.get(key)
    if (!targetDep) {
      targetTracks.set(key, (targetDep = new Set()))
    }

    trackEffect(targetDep)
  }
}

export function trackEffect(dep: Dep) {
  if (activeEffect && !dep.has(activeEffect)) {
    dep.add(activeEffect)
    activeEffect.deps.push(dep)
  }
}

export function cleanupTrackEffect(target: object, key: string | symbol) {
  const depsMap = effectTracks.get(
    target[ReactiveFlags.IS_PRIMITIVE]
      ? target[ReactiveFlags.RAW_VALUE]
      : target[ReactiveFlags.RAW]
  )
  if (depsMap) {
    const deps = depsMap.get(key)
    if (deps) {
      deps.clear()
    }
  }
}

export function trigger(
  target: object,
  key: unknown,
  type: TriggerTypes,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  value?: unknown
) {
  const targetTracks = effectTracks.get(target)
  if (targetTracks) {
    const deps: Dep[] = []
    if (key === 'length' && isArray(target)) {
      targetTracks.forEach((dep, key) => {
        if (key === 'length') {
          deps.push(dep)
        }
      })
    } else {
      deps.push(targetTracks.get(key))

      switch (type) {
        case TriggerTypes.ADD:
          if (!isArray(target)) {
            deps.push(targetTracks.get(ITERATE_KEY))
            if (isMap(target)) {
              deps.push(targetTracks.get(MAP_KEY_ITERATE_KEY))
            }
          } else if (isIntegerKey(key)) {
            // new index added to array -> length changes
            deps.push(targetTracks.get('length'))
          }
          break
        case TriggerTypes.DELETE:
          if (!isArray(target)) {
            deps.push(targetTracks.get(ITERATE_KEY))
            if (isMap(target)) {
              deps.push(targetTracks.get(MAP_KEY_ITERATE_KEY))
            }
          }
          break
        case TriggerTypes.SET:
          if (isMap(target)) {
            deps.push(targetTracks.get(ITERATE_KEY))
          }
          break
      }
    }
    if (deps.length === 1) {
      if (deps[0]) {
        triggerEffect(deps[0])
      }
    } else {
      const effects: Effect[] = []
      for (const dep of deps) {
        if (dep) {
          effects.push(...dep)
        }
      }
      triggerEffect(new Set(effects))
    }
  }
}

export function triggerEffect(dep: Dep | Effect[]) {
  const deps = isArray(dep) ? dep : [...dep]
  for (const effect of deps) {
    if (effect !== activeEffect || effect.allowEffect) {
      if (effect.scheduler) {
        effect.scheduler()
      } else {
        effect.run()
      }
    }
  }
}
