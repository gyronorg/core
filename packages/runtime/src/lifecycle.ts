import { isBoolean } from '@gyron/shared'
import {
  getCurrentComponent,
  callWithErrorHandling,
  ErrorHandlingType,
} from './component'
import type { Component } from './component'

type LifecycleCallback = (component: Component) => any
type LifecycleUpdateCallback = (
  oldProps: object,
  props?: object
) => any | boolean

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
      params.push(component.oldProps, component.props)
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

function initialLifecycle(component: Component, key: keyof Lifecycle) {
  if (!component.lifecycle) {
    component.lifecycle = {
      [key]: new Set(),
    }
  }
  if (!component.lifecycle[key]) {
    component.lifecycle[key] = new Set()
  }
}

/**
 * 生命周期勾子，注册一个回调函数，组件渲染之前调用。
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
 * @param callback 回调函数
 */
export function onBeforeMount(callback: LifecycleCallback) {
  const component = getCurrentComponent()
  initialLifecycle(component, 'beforeMounts')
  component.lifecycle.beforeMounts.add(callback)
}

/**
 * 生命周期勾子，注册一个回调函数，组件渲染之后调用，可以在回调函数中拿到真实的 DOM 信息。
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
 * @param callback 回调函数
 */
export function onAfterMount(callback: LifecycleCallback) {
  const component = getCurrentComponent()
  initialLifecycle(component, 'afterMounts')
  component.lifecycle.afterMounts.add(callback)
}

/**
 * 生命周期勾子，注册一个回调函数，组件销毁之后调用。
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
 * @param callback 回调函数
 */
export function onDestroyed(callback: LifecycleCallback) {
  const component = getCurrentComponent()
  initialLifecycle(component, 'destroyed')
  component.lifecycle.destroyed.add(callback)
}

/**
 * 生命周期勾子，注册一个回调函数，组件更新之前调用。可以返回 Falsy 组织自身和子组件的更新。
 * ```js
 * import { h, onBeforeUpdate } from 'gyron'
 *
 * const App = h(() => {
 *   onBeforeUpdate((oldProps, props) => {
 *     return false // 当发生变更也不会更新视图
 *   })
 *   return () => h('div', 'hello world')
 * })
 * ```
 * @api component
 * @param callback 回调函数
 */
export function onBeforeUpdate(callback: LifecycleUpdateCallback) {
  const component = getCurrentComponent()
  initialLifecycle(component, 'beforeUpdates')
  component.lifecycle.beforeUpdates.add(callback)
}

/**
 * 生命周期勾子，注册一个回调函数，组件渲染之前调用。
 * ```js
 * import { h, onAfterUpdate } from 'gyron'
 *
 * const App = h(() => {
 *   onAfterUpdate((oldProps, props) => {
 *     component // self
 *   })
 *   return () => h('div', 'hello world')
 * })
 * ```
 * @api component
 * @param callback 回调函数
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
