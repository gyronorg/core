import {
  isVNodeComponent,
  onAfterMount,
  onDestroyed,
  usePlugin,
} from '@gyron/runtime'
import {
  RouterHookBeforeEach,
  RouterHookAfterEach,
  RouterHookBeforeUpdate,
  RouterHookAfterUpdate,
} from './event'
import { TypeRouter } from './hooks'
import { RouterBase } from './router'

function getRouter(): RouterBase {
  const context = usePlugin()
  return context.get(TypeRouter)
}

export function onBeforeRouteEach(listener: RouterHookBeforeEach) {
  const router = getRouter()
  if (!router) {
    onAfterMount(() => {
      getRouter().addHook('beforeEach', listener)
    })
  } else {
    router.addHook('beforeEach', listener)
  }
  onDestroyed(() => {
    router.removeHook('beforeEach', [listener])
  })
}

export function onAfterRouteEach(listener: RouterHookAfterEach) {
  const router = getRouter()
  if (!router) {
    onAfterMount(() => {
      getRouter().addHook('afterEach', listener)
    })
  } else {
    router.addHook('afterEach', listener)
  }
  onDestroyed(() => {
    router.removeHook('afterEach', [listener])
  })
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
