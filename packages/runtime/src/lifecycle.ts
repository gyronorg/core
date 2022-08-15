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

export interface Lifecycle {
  beforeMounts: Set<LifecycleCallback>
  afterMounts: Set<LifecycleCallback>
  destroyed: Set<LifecycleCallback>
  beforeUpdates: Set<LifecycleUpdateCallback>
  afterUpdates: Set<LifecycleUpdateCallback>
}

function wrapLifecycle(component: Component, type: keyof Lifecycle) {
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

export function initialLifecycle(): Lifecycle {
  return {
    beforeMounts: new Set(),
    afterMounts: new Set(),
    destroyed: new Set(),
    beforeUpdates: new Set(),
    afterUpdates: new Set(),
  }
}

export function onBeforeMount(callback: LifecycleCallback) {
  const component = useComponent()
  component.lifecycle.beforeMounts.add(callback)
}
export function onAfterMount(callback: LifecycleCallback) {
  const component = useComponent()
  component.lifecycle.afterMounts.add(callback)
}
export function onDestroyed(callback: LifecycleCallback) {
  const component = useComponent()
  component.lifecycle.destroyed.add(callback)
}
export function onBeforeUpdate(callback: LifecycleUpdateCallback) {
  const component = useComponent()
  component.lifecycle.beforeUpdates.add(callback)
}
export function onAfterUpdate(callback: LifecycleUpdateCallback) {
  const component = useComponent()
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
