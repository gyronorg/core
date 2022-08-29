import { Component, getCurrentComponent } from './component'
import { getErrorBoundaryCtx } from './ErrorBoundary'

export type BoundariesHandlerParamsType = 'Error' | 'Warn'
export type BoundariesHandlerParams = Partial<{
  message: string
  component: Component
  stack: string
  type: BoundariesHandlerParamsType
}>
export type BoundariesHandler = (params: BoundariesHandlerParams) => void

export const ErrorType = Symbol.for('gyron.error-handler')
export const WarnType = Symbol.for('gyron.warn-handler')

/**
 * Register an event listener for errors and the registered callback function
 * will be executed when an error occurs in the component.
 * ```js
 * import { registerErrorHandler, h } from 'gyron'
 * const App = h(() => {
 *   registerErrorHandler(({ message }) => {
 *     message // Uncaught exceptions
 *   })
 *   throw new Error('Uncaught exceptions')
 * })
 * ```
 * @api boundaries
 * @param handler Handling functions.
 */
export function registerErrorHandler(handler: BoundariesHandler) {
  const component = getCurrentComponent()
  component.ctx[ErrorType] = handler
}

/**
 * Register an event listener for warnings, the registered callback function
 * will be executed when a warning occurs on the component.
 * ```js
 * import { registerWarnHandler, useInject, h } from 'gyron'
 *
 * const App = h(() => {
 *   registerWarnHandler(({ message }) => {
 *     message // Contextual information not obtained ...
 *   })
 *   useInject()('a')
 *   return h('div', 'hello world')
 * })
 *```
 * @api boundaries
 * @param handler Handling functions.
 */
export function registerWarnHandler(handler: BoundariesHandler) {
  const component = getCurrentComponent()
  component.ctx[WarnType] = handler
}

function manualHandlerBase(
  type: BoundariesHandlerParamsType,
  error: Error | unknown,
  component: Component
) {
  if (!component) {
    console.warn(
      'No component instance found, you can get { component } on the component parameter'
    )
    return null
  }
  const componentHandle = component.ctx[type === 'Error' ? ErrorType : WarnType]
  const handler = (componentHandle ||
    getErrorBoundaryCtx(component)) as BoundariesHandler
  if (!handler) {
    console.warn(
      'No ErrorBoundary component was found in the upper level component, please register the ErrorBoundary component and try again.'
    )
    return null
  }
  if (error instanceof Error) {
    handler({
      type: type,
      message: error.message,
      component: component,
      stack: error.stack,
    })
  } else {
    handler({ type: type, message: String(error), component: component })
  }
}

/**
 * Proactive triggering of event callbacks registered via the registerErrorHandler method.
 * ```js
 * import { manualErrorHandler, h } from 'gyron'
 *
 * const App = h(() => {
 *   Promise.reject('Error: Uncaught exceptions').catch((e) => {
 *     manualErrorHandler(e, component)
 *   })
 *   return h('div', 'hello world')
 * })
 * ```
 * @api boundaries
 * @param error Error log message
 * @param component The component instance, which can be obtained via the second parameter of the component function.
 */
export function manualErrorHandler(
  error: Error | unknown,
  component: Component
) {
  return manualHandlerBase('Error', error, component)
}

/**
 * Proactive triggering of event callbacks registered via the registerWarnHandler method
 * ```js
 * import { manualWarnHandler, h } from 'gyron'
 *
 * const App = h(() => {
 *   manualWarnHandler('Warn: performance is not defined', component)
 *   return h('div', 'hello world')
 * })
 * ```
 * @api boundaries
 * @param warn Warning log message.
 * @param component The component instance, which can be obtained via the second parameter of the component function.
 */
export function manualWarnHandler(warn: string, component: Component) {
  return manualHandlerBase('Warn', warn, component)
}
