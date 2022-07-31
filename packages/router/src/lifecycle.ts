import { isVNodeComponent, onDestroyed } from '@gyron/runtime'
import {
  RouterHookBeforeEach,
  RouterHookAfterEach,
  RouterHookBeforeUpdate,
  RouterHookAfterUpdate,
} from './event'
import { useRouter } from './hooks'

export function onBeforeRouteEach(listener: RouterHookBeforeEach) {
  const router = useRouter()
  onDestroyed(() => {
    router.removeHook('beforeEach', [listener])
  })
  router.addHook('beforeEach', listener)
}

export function onAfterRouteEach(listener: RouterHookAfterEach) {
  const router = useRouter()
  onDestroyed(() => {
    router.removeHook('afterEach', [listener])
  })
  router.addHook('afterEach', listener)
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
