import { warn } from './assert'
import { Component, getCurrentComponent } from './component'

export function useRootContext() {
  const component = getCurrentComponent()
  if (!component.vnode.root) {
    warn(
      'useRootContext Exception occurred, no root node information was obtained, please report to https://github.com/Linkontoask/gyron/issues',
      null,
      'useRootContext'
    )
    return null
  }
  return component.vnode.root.context
}

export function provide(
  component: Component,
  name: string | symbol,
  data: unknown
) {
  component.ctx[name] = data
}

export function inject<T = unknown>(
  component: Component,
  name: string | symbol,
  shouldWarn = true
) {
  let parentComponent = component.parent
  while (parentComponent && !parentComponent.ctx[name]) {
    parentComponent = parentComponent.parent
  }
  if (!parentComponent) {
    if (shouldWarn) {
      warn(
        'Contextual information not obtained, key: ' + String(name),
        component,
        'inject'
      )
    }
    return null
  }
  return parentComponent.ctx[name] as T
}

export function useProvide<T = unknown>() {
  const component = getCurrentComponent()
  return (name: string | symbol, data: T) => provide(component, name, data)
}

export function useInject() {
  const component = getCurrentComponent()
  return <T>(name: string | symbol) => inject<T>(component, name)
}

export function useComponentContext() {
  const component = getCurrentComponent()

  return {
    context: component.ctx,
    provide: useProvide(),
    inject: useInject(),
  }
}
