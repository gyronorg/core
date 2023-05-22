import type { Component } from './component'
import {
  KeysToValues,
  at,
  initialLifecycle,
  isArray,
  isBoolean,
  isEqual,
} from '@gyron/shared'
import {
  getCurrentComponent,
  callWithErrorHandling,
  ErrorHandlingType,
} from './component'

type LifecycleCallback = (component: Component) => any
type LifecycleUpdateCallback<T = any> = {
  (prevProps: T, props?: T): void | boolean
  _once?: boolean
}

export type Lifecycle = Partial<{
  beforeMounts: Set<LifecycleCallback>
  afterMounts: Set<LifecycleCallback>
  beforeDestroy: Set<LifecycleCallback>
  destroyed: Set<LifecycleCallback>
  beforeUpdates: Set<LifecycleUpdateCallback>
  afterUpdates: Set<LifecycleUpdateCallback>
}>

function wrapLifecycle(component: Component, type: keyof Lifecycle) {
  if (!component.lifecycle || !component.lifecycle[type]) return

  const lifecycle = [...component.lifecycle[type]]
  const wrapResult = []

  for (let i = 0; i < lifecycle.length; i++) {
    const listener = lifecycle[i]
    const params = []
    if (type === 'beforeUpdates' || type === 'afterUpdates') {
      params.push(component.prevProps, component.props)
      const f = listener as LifecycleUpdateCallback
      if (f._once) {
        component.lifecycle[type].delete(f)
      }
    } else {
      params.push(component)
    }
    const result = callWithErrorHandling(
      listener,
      component,
      ErrorHandlingType.Lifecycle,
      params
    )

    if (type === 'beforeUpdates' && isBoolean(result) && !result) {
      return false
    }

    wrapResult.push(result)
  }

  return wrapResult
}

/**
 * Listens for changes to component parameters and executes callback functions when changes occur.
 * ```js
 * import { h, useWatchProps } from 'gyron'
 *
 * const App = h(({ foo, bar }) => {
 *   useWatchProps('foo', (foo) => {
 *     foo
 *   })
 *   useWatchProps(['foo', 'bar'], ([foo, bar]) => {
 *     foo
 *     bar
 *   })
 *   return h('div', 'hello world')
 * })
 * ```
 * @api component
 * @param keys props key or keys.
 * @param callback Callback function.
 */
export function onWatchProps<O extends Record<string, any>>() {
  return function watch<const T extends keyof O | readonly (keyof O)[]>(
    keys: T,
    callback: (values: T extends keyof O ? O[T] : KeysToValues<O, T>) => void,
    once?: boolean
  ) {
    onBeforeUpdate((prevProps, props) => {
      const r1: any[] = []
      const r2: any[] = []
      if (isArray(keys)) {
        r1.push(...keys.map((key) => at(prevProps, key)))
        r2.push(...keys.map((key) => at(props, key)))
        if (!isEqual(r1, r2)) {
          callback(r2 as any)
        }
      } else {
        r1.push(at(prevProps, keys as string))
        r2.push(at(props, keys as string))
        if (!isEqual(r1, r2)) {
          callback(r2[0])
        }
      }
    }, once)
    return watch
  }
}

/**
 * Lifecycle hooks, register a callback function that is called before the component is rendered.
 * ```js
 * import { h, onBeforeMount } from 'gyron'
 *
 * const App = h(() => {
 *   onBeforeMount((component) => {
 *     component // self
 *   })
 *   return h('div', 'hello world')
 * })
 * ```
 * @api component
 * @param callback Callback function.
 */
export function onBeforeMount(callback: LifecycleCallback) {
  const component = getCurrentComponent()
  initialLifecycle(component, 'beforeMounts')
  component.lifecycle.beforeMounts.add(callback)
}

/**
 * Life cycle hooks, register a callback function to be called after the component has been rendered,
 * where you can get the real DOM information in the callback function.
 * ```js
 * import { h, onAfterMount } from 'gyron'
 *
 * const App = h(() => {
 *   onAfterMount((component) => {
 *     component.$el // HTMLDivElement
 *   })
 *   return h('div', 'hello world')
 * })
 * ```
 * @api component
 * @param callback Callback function.
 */
export function onAfterMount(callback: LifecycleCallback) {
  const component = getCurrentComponent()
  initialLifecycle(component, 'afterMounts')
  component.lifecycle.afterMounts.add(callback)
}

/**
 * Lifecycle hook to register a callback function to be called before the component has been destroyed.
 * ```js
 * import { h, onBeforeDestroy, createRef } from 'gyron'
 *
 * const App = h(() => {
 *   const container = createRef()
 *   onBeforeDestroy((component) => {
 *     console.log(container.current)
 *   })
 *   return h('div', { ref: container }, 'hello world')
 * })
 * ```
 * @api component
 * @param callback Callback function.
 */
export function onBeforeDestroy(callback: LifecycleCallback) {
  const component = getCurrentComponent()
  initialLifecycle(component, 'beforeDestroy')
  component.lifecycle.beforeDestroy.add(callback)
}

/**
 * Lifecycle hook to register a callback function to be called after the component has been destroyed.
 * ```js
 * import { h, onDestroyed } from 'gyron'
 *
 * const App = h(() => {
 *   const timer = setInterval(() => {
 *     console.log(Date.now())
 *   }, 1000)
 *   onDestroyed((component) => {
 *     clearInterval(timer)
 *   })
 *   return h('div', 'hello world')
 * })
 * ```
 * @api component
 * @param callback Callback function.
 */
export function onDestroyed(callback: LifecycleCallback) {
  const component = getCurrentComponent()
  initialLifecycle(component, 'destroyed')
  component.lifecycle.destroyed.add(callback)
}

/**
 * Lifecycle hooks that register a callback function to be called before the component is updated.
 * Returning `Falsy` prevents updates to itself and sub components.
 * ```js
 * import { h, onBeforeUpdate } from 'gyron'
 *
 * const App = h(() => {
 *   onBeforeUpdate((prevProps, props) => {
 *     return false // The view will not be updated even when changes occur
 *   })
 *   return h('div', 'hello world')
 * })
 * ```
 * @api component
 * @param callback Callback function.
 */
export function onBeforeUpdate<T extends object>(
  callback: LifecycleUpdateCallback<T>,
  once?: boolean
) {
  const component = getCurrentComponent()
  initialLifecycle(component, 'beforeUpdates')
  once && (callback._once = once)
  component.lifecycle.beforeUpdates.add(callback)
}

/**
 * Lifecycle hooks, register a callback function that is called before the component is rendered.
 * ```js
 * import { h, onAfterUpdate } from 'gyron'
 *
 * const App = h(() => {
 *   onAfterUpdate((prevProps, props) => {
 *     component // self
 *   })
 *   return h('div', 'hello world')
 * })
 * ```
 * @api component
 * @param callback Callback function.
 */
export function onAfterUpdate(
  callback: LifecycleUpdateCallback,
  once?: boolean
) {
  const component = getCurrentComponent()
  initialLifecycle(component, 'afterUpdates')
  once && (callback._once = once)
  component.lifecycle.afterUpdates.add(callback)
}

export function invokeLifecycle(component: Component, type: keyof Lifecycle) {
  switch (type) {
    case 'beforeMounts':
    case 'afterMounts':
    case 'beforeDestroy':
    case 'destroyed':
    case 'beforeUpdates':
    case 'afterUpdates':
      return wrapLifecycle(component, type)
  }
}
