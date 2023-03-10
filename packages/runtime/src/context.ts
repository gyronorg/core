import { assertWarn } from './assert'
import { Component, getCurrentComponent } from './component'

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
      assertWarn(
        'Contextual information not obtained, key: ' + String(name),
        component,
        'inject'
      )
    }
    return null
  }
  return parentComponent.ctx[name] as T
}

/**
 * Inject any data into all child components, either deep components or sibling components.
 * ```js
 * import { h, useProvide } from 'gyron'
 *
 * const App = h(() => {
 *   const provide = useProvide()
 *   provide('data', 0)
 *   return h('div', 'hello world')
 * })
 * ```
 * @api context
 */
export function useProvide<T = unknown>() {
  const component = getCurrentComponent()
  return (name: string | symbol, data: T) => provide(component, name, data)
}

/**
 * After the upper level component has used `useProvide`, the injected data is retrieved via `useInject`.
 * ```js
 * import { h, useInject } from 'gyron'
 *
 * const Child = h(() => {
 *   const inject = useInject()
 *   const data = inject('data') // 0
 *   return h('div', data)
 * })
 *
 * const App = h(() => {
 *   const provide = useProvide()
 *   provide('data', 0)
 *   return h(Child)
 * })
 * ```
 * @api context
 */
export function useInject() {
  const component = getCurrentComponent()
  return <T>(name: string | symbol) => inject<T>(component, name)
}

/**
 * Gets information about the `context` in the current component and contains the `provide` and `inject` functions.
 * ```javascript
 * import { h, useComponentContext } from 'gyron'
 *
 * const Child = h(() => {
 *   const context = useComponentContext()
 *   context['data'] // 0
 *   return h('div', 'child')
 * })
 *
 * const App = h(() => {
 *   const { context } = useComponentContext()
 *   context['data'] = 0
 *   return h(Child)
 * })
 * ```
 * @api context
 * @returns object
 */
export function useComponentContext() {
  const component = getCurrentComponent()

  return {
    context: component.ctx,
    provide: useProvide(),
    inject: useInject(),
  }
}
