import { useReactive } from '@gyron/reactivity'
import { isFunction } from '@gyron/shared'
import { Component, FC } from './component'
import { VNode } from './vnode'
import { h } from './h'
import { inject, useProvide } from './context'
import { BoundariesHandler, BoundariesHandlerParams } from './boundaries'

export interface ErrorBoundaryProps {
  fallback: VNode
}

export function getErrorBoundaryCtx(component: Component) {
  return inject(component, ErrorBoundaryType, false)
}

export const ErrorBoundaryType = Symbol.for('gyron.error-boundary')

export const ErrorBoundary = FC<ErrorBoundaryProps>(function ErrorBoundary() {
  const state = useReactive<{
    error: boolean
    payload: BoundariesHandlerParams
  }>({
    error: false,
    payload: null,
  })
  // Inject error-catching code to give the user the ability to handle subComponents when an error occurs
  useProvide<BoundariesHandler>()(
    ErrorBoundaryType,
    ({ type, message, component, stack }) => {
      state[type.toLocaleLowerCase()] = true
      state.payload = {
        type,
        message,
        component,
        stack,
      }
    }
  )

  return function ErrorBoundaryRender({ children, fallback }) {
    return state.error
      ? isFunction(fallback.type)
        ? h(fallback, state.payload)
        : fallback
      : children
  }
})
