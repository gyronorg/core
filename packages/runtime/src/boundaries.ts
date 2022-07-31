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

export const ErrorType = Symbol('error_handler')
export const WarnType = Symbol('warn_handler')

export function registerErrorHandler(handler: BoundariesHandler) {
  const component = getCurrentComponent()
  component.ctx[ErrorType] = handler
}

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

export function manualErrorHandler(
  error: Error | unknown,
  component: Component
) {
  return manualHandlerBase('Error', error, component)
}

export function manualWarnHandler(warn: Error | unknown, component: Component) {
  return manualHandlerBase('Warn', warn, component)
}
