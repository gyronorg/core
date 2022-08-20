import { initialLifecycle, isBoolean } from '@gyron/shared'
import {
  getCurrentComponent,
  callWithErrorHandling,
  ErrorHandlingType,
} from './component'
import type { Component } from './component'

type LifecycleCallback = (component: Component) => any
type LifecycleUpdateCallback<T extends object = object> = (
  prevProps: T,
  props?: T
) => void | boolean

export type Lifecycle = Partial<{
  beforeMounts: Set<LifecycleCallback>
  afterMounts: Set<LifecycleCallback>
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
 * Lifecycle hooks, register a callback function that is called before the component is rendered.
 * ```js
 * import { h, onBeforeMount } from 'gyron'
 *
 * const App = h(() => {
 *   onBeforeMount((component) => {
 *     component // self
 *   })
 *   return () => h('div', 'hello world')
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
 *   return () => h('div', 'hello world')
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
 *   return () => h('div', 'hello world')
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
 * Updates to the `Falsy` organisation itself and to child components can be returned.
 * ```js
 * import { h, onBeforeUpdate } from 'gyron'
 *
 * const App = h(() => {
 *   onBeforeUpdate((prevProps, props) => {
 *     return false // The view will not be updated even when changes occur
 *   })
 *   return () => h('div', 'hello world')
 * })
 * ```
 * @api component
 * @param callback Callback function.
 */
export function onBeforeUpdate<T extends object>(
  callback: LifecycleUpdateCallback<T>
) {
  const component = getCurrentComponent()
  initialLifecycle(component, 'beforeUpdates')
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
 *   return () => h('div', 'hello world')
 * })
 * ```
 * @api component
 * @param callback Callback function.
 */
export function onAfterUpdate(callback: LifecycleUpdateCallback) {
  const component = getCurrentComponent()
  initialLifecycle(component, 'afterUpdates')
  component.lifecycle.afterUpdates.add(callback)
}

export function invokeLifecycle(component: Component, type: keyof Lifecycle) {
  switch (type) {
    case 'beforeMounts':
    case 'afterMounts':
    case 'destroyed':
    case 'beforeUpdates':
    case 'afterUpdates':
      return wrapLifecycle(component, type)
  }
}
