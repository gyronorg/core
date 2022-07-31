import { isBoolean } from '@gyron/shared'
import { Component, getCurrentComponent } from './component'
import { callWithErrorHandling, ErrorHandlingType } from './renderComponent'

type LifecycleCallback<T = void> = (component: Component, props?: any) => T

export interface Lifecycle {
  beforeMounts: Set<LifecycleCallback | LifecycleCallback<Promise<any>>>
  afterMounts: Set<LifecycleCallback | LifecycleCallback<Promise<any>>>
  destroyed: Set<LifecycleCallback | LifecycleCallback<Promise<any>>>
  beforeUpdates: Set<LifecycleCallback<boolean | void>>
  afterUpdates: Set<LifecycleCallback | LifecycleCallback<Promise<any>>>
}

function createSet(n?: LifecycleCallback[]) {
  return new Set(n)
}

function wrapLifecycle(component: Component, type: keyof Lifecycle) {
  const lifecycle = Array.from(component.lifecycle[type])
  const wrapResult = []

  for (let i = 0; i < lifecycle.length; i++) {
    const listener = lifecycle[i]
    const result = callWithErrorHandling(
      listener,
      component,
      ErrorHandlingType.Lifecycle,
      [component, component.oldProps]
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
    beforeMounts: createSet(),
    afterMounts: createSet(),
    destroyed: createSet(),
    beforeUpdates: createSet(),
    afterUpdates: createSet(),
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
export function onBeforeUpdate(callback: LifecycleCallback<boolean | void>) {
  const component = useComponent()
  component.lifecycle.beforeUpdates.add(callback)
}
export function onAfterUpdate(callback: LifecycleCallback) {
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
