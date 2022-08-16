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

function useComponent() {
  const component = getCurrentComponent()
  return component
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

export function onBeforeMount(callback: LifecycleCallback) {
  const component = useComponent()
  initialLifecycle(component, 'beforeMounts')
  component.lifecycle.beforeMounts.add(callback)
}
export function onAfterMount(callback: LifecycleCallback) {
  const component = useComponent()
  initialLifecycle(component, 'afterMounts')
  component.lifecycle.afterMounts.add(callback)
}
export function onDestroyed(callback: LifecycleCallback) {
  const component = useComponent()
  initialLifecycle(component, 'destroyed')
  component.lifecycle.destroyed.add(callback)
}
export function onBeforeUpdate(callback: LifecycleUpdateCallback) {
  const component = useComponent()
  initialLifecycle(component, 'beforeUpdates')
  component.lifecycle.beforeUpdates.add(callback)
}
export function onAfterUpdate(callback: LifecycleUpdateCallback) {
  const component = useComponent()
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
