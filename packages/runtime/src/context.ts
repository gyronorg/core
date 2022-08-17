import { warn } from './assert'
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

/**
 * 向所有子组件中注入任何数据，可以是深度组件，也可以是同级组件。
 * ```js
 * import { h, useProvide } from 'gyron'
 *
 * const App = h(() => {
 *   const provide = useProvide()
 *   provide('data', 0)
 *   return () => h('div', 'hello world')
 * })
 * ```
 * @api context
 */
export function useProvide<T = unknown>() {
  const component = getCurrentComponent()
  return (name: string | symbol, data: T) => provide(component, name, data)
}

/**
 * 当上层组件使用`useProvide`之后，通过`useInject`获取注入的数据。
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
 *   return () => h(Child)
 * })
 * ```
 * @api context
 */
export function useInject() {
  const component = getCurrentComponent()
  return <T>(name: string | symbol) => inject<T>(component, name)
}

/**
 * 获取当前组件中的`context`信息，包含了`provide`和`inject`两个函数。
 * ```javascript
 * import { h, useComponentContext } from 'gyron'
 *
 * const Child = h(() => {
 *   const context = useComponentContext()
 *   context['data'] // 0
 *   return () => h('div', 'child')
 * })
 *
 * const App = h(() => {
 *   const { context } = useComponentContext()
 *   context['data'] = 0
 *   return () => h(Child)
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
