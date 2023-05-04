import {
  isVNodeComponent,
  onAfterMount,
  onDestroyed,
  getPlugins,
} from '@gyron/runtime'
import {
  RouterHookBeforeEach,
  RouterHookAfterEach,
  RouterHookBeforeUpdate,
  RouterHookAfterUpdate,
  RouterHooks,
} from './event'
import { TypeRouter } from './hooks'
import { RouterBase } from './router'

function getRouter(): RouterBase {
  const context = getPlugins()
  return context.get(TypeRouter)
}

function addHook(
  hookName: keyof RouterHooks,
  listener: RouterHookBeforeEach | RouterHookAfterEach
) {
  const router = getRouter()
  if (!router) {
    onAfterMount(() => {
      getRouter().addHook(hookName, listener)
    })
  } else {
    router.addHook(hookName, listener)
  }
  onDestroyed(() => {
    router.removeHook(hookName, [listener])
  })
}

export function onBeforeRouteEach(listener: RouterHookBeforeEach) {
  addHook('beforeEach', listener)
}

export function onAfterRouteEach(listener: RouterHookAfterEach) {
  addHook('afterEach', listener)
}

export function onBeforeRouteUpdate(listener: RouterHookBeforeUpdate) {
  onBeforeRouteEach((from, to, next) => {
    if (
      isVNodeComponent(from.extra.element) &&
      isVNodeComponent(to.extra.element) &&
      from.extra.element.type === to.extra.element.type
    ) {
      listener(from, to)
    }
    next()
  })
}

export function onAfterRouteUpdate(listener: RouterHookAfterUpdate) {
  onAfterRouteEach((from, to) => {
    if (
      isVNodeComponent(from.extra.element) &&
      isVNodeComponent(to.extra.element) &&
      from.extra.element.type === to.extra.element.type
    ) {
      listener(from, to)
    }
  })
}
