import { Component } from './component'
import { getErrorBoundaryCtx } from './internal'
import { ErrorType, WarnType, BoundariesHandler } from './boundaries'

export enum InnerCode {
  Transition = 1000,
}

export function warn(
  err: Error | string,
  component: Component | null,
  type: string
) {
  if (component && component.ctx[WarnType]) {
    const errorHandler = component.ctx[WarnType] as BoundariesHandler
    if (err instanceof Error) {
      errorHandler({
        type: 'Warn',
        message: err.message,
        component: component,
        stack: err.stack,
      })
    } else {
      errorHandler({
        type: 'Warn',
        message: err,
        component: component,
        stack: null,
      })
    }
  } else {
    console.warn(`[Gyron ${type}]`, err, '\n', component)
  }
}

export function error(err: Error, component: Component | null, type: string) {
  if (component) {
    let errorHandler: BoundariesHandler
    if (component.ctx[ErrorType]) {
      errorHandler = component.ctx[ErrorType] as BoundariesHandler
    }
    if (!errorHandler) {
      errorHandler = getErrorBoundaryCtx(component) as BoundariesHandler
    }
    if (errorHandler) {
      errorHandler({
        type: 'Error',
        message: err.message,
        component: component,
        stack: err.stack,
      })
      return null
    }
  }
  console.error(`[Gyron ${type}]`, err, '\n', component)
}
