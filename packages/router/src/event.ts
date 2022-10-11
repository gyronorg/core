import {
  extend,
  isBoolean,
  isFunction,
  isUndefined,
  join,
  Noop,
  resolve,
} from '@gyron/shared'
import { Blocker, Path, To } from 'history'
import { useHref, useParsePath } from './hooks'
import { generateRouteBranch, getTargetRoute } from './matches'
import { RouteRecord } from './route'
import { History, Location, pending } from './router'

export type HookRecord = Path & { meta?: any }
export type HookNext = (to?: To | false) => void
export type RouterHookBeforeEach = (
  from: RouteRecord,
  to: RouteRecord,
  next: HookNext
) => void
export type RouterHookAfterEach = (from: RouteRecord, to: RouteRecord) => void
export type RouterHookBeforeUpdate = (
  from: RouteRecord,
  to: RouteRecord
) => void
export type RouterHookAfterUpdate = (from: RouteRecord, to: RouteRecord) => void
export type RouterHookListener = RouterHookBeforeEach | RouterHookAfterEach
export type SetItem<T> = T extends Set<infer K> ? K : never

export interface RouterHooks {
  beforeEach: Set<RouterHookBeforeEach>
  afterEach: Set<RouterHookAfterEach>
}

export interface State {
  back: string
  current: string
  forward: string
  redirect?: To
}

export interface WrapActionPayload {
  actionHandler: ActionHandler
  to: To
  type: 'push' | 'replace' | 'go'
}

export type ActionHandler = (to: RouteRecord | null) => void

function callWithErrorHandling(
  fn: (...args: any[]) => any,
  type: any,
  args?: unknown[]
) {
  let res: any
  try {
    res = args ? fn(...args) : fn()
  } catch (err) {
    console.error(type, err)
  }
  return res
}

function isSkip(to: To | boolean) {
  return isBoolean(to) && !to
}

function getTargetPath(base: string, route: RouteRecord, to: To) {
  let path: To = to
  if (route && route.extra.matchFromRedirect) {
    // The regexpPath of the redirect route is the real url, not the regular
    path = route.extra.regexpPath
  }
  return join(base, useHref(path))
}

function resolveUrl(base: string, path: string) {
  if (base.endsWith('/')) {
    return resolve(base, path)
  }
  if (isUndefined(path) || path === '') {
    return base
  }
  return resolve(base, '..', path)
}

export class HistoryEvent {
  public hooks: RouterHooks = {
    beforeEach: new Set(),
    afterEach: new Set(),
  }
  public location: Location
  public nestedRoutes: RouteRecord[] = []
  public matchRouteBranch: RouteRecord[] = []

  constructor(
    public history: History,
    public base: string,
    public isSSR = false
  ) {
    this.location = this.history.location

    this.replaceState(null, {
      current: useHref(this.location),
    })
  }

  get state() {
    return this.history.location.state
  }

  get currentRoute() {
    return getTargetRoute(this.matchRouteBranch)
  }

  /**
   * call the router hook.
   * returns a Boolean value, or skips the update if it is false
   */
  async invokeHook(
    type: keyof RouterHooks,
    form?: RouteRecord,
    to?: RouteRecord
  ) {
    const hooks = [...this.hooks[type]]
    for (let i = 0; i < hooks.length; i++) {
      const listener = hooks[i]
      if (type === 'beforeEach') {
        const ret = await new Promise<boolean>((resolve, reject) => {
          try {
            const next: HookNext = (to) => {
              if (to) {
                this.replace(to).then(() => resolve(false))
              } else if (isSkip(to)) {
                resolve(false)
              } else {
                resolve(true)
              }
            }
            listener(form, to, next)
          } catch (e) {
            reject(e)
          }
        })
        if (!ret) {
          return false
        }
      } else {
        callWithErrorHandling(listener, 'AfterEach', [form, to])
      }
    }
    return true
  }

  async guards(
    from: RouteRecord,
    to: RouteRecord,
    handler: Noop,
    fuseHandler?: Noop
  ): Promise<boolean | void> {
    const ret = await this.invokeHook('beforeEach', from, to)
    if (isSkip(ret)) {
      if (isFunction(fuseHandler)) {
        // return to pre-meltdown state after meltdown
        return fuseHandler()
      }
      return false
    }
    handler()
    await this.invokeHook('afterEach', from, to)
    return true
  }

  /**
   * format from and to so that the application is not updated if no target route is found
   */
  private async wrapHookWithAction(payload: WrapActionPayload) {
    const base = this.history.location.pathname
    const pathname = resolveUrl(
      base,
      useParsePath(useHref(payload.to)).pathname
    )
    const { from, to } = this.navigation(base, pathname)

    if (payload.type === 'push') {
      this.replaceState(null, {
        forward: resolveUrl(base, useHref(payload.to)),
      })
    }

    try {
      // when the destination route is redirected, the route after the redirect is used
      const fromPath = useHref(this.history.location)
      const toPath = useHref(getTargetPath(this.base, to, payload.to))
      // verify that the current user action needs to be updated
      if (fromPath !== toPath) {
        await this.guards(from, to, () =>
          callWithErrorHandling(payload.actionHandler, 'History Action', [to])
        )
      }
    } catch (e) {
      console.error(e)
    }
  }

  push(to: To, state?: any) {
    return this.wrapHookWithAction({
      actionHandler: (route) => {
        const base = this.history.location.pathname
        const back = this.state?.current
        const path = getTargetPath(this.base, route, to)
        const current = resolveUrl(base, useHref(path))
        this.history.push(
          path,
          extend({}, state, { current: current, back: back })
        )
      },
      to: to,
      type: 'push',
    })
  }
  replace(to: To, state?: any) {
    return this.wrapHookWithAction({
      actionHandler: (route) => {
        const base = this.history.location.pathname
        const path = getTargetPath(this.base, route, to)
        const current = resolveUrl(base, useHref(path))
        this.history.replace(path, extend({}, state, { current: current }))
      },
      to: to,
      type: 'replace',
    })
  }
  back() {
    return this.go(-1)
  }
  forward() {
    return this.go(1)
  }
  go(delta: number) {
    this.history.go(delta)
    return pending
  }
  block(blocker: Blocker) {
    this.history.block(blocker)
  }

  replaceState(to?: To, state?: Partial<State>) {
    if (!this.isSSR) {
      const nextState = extend<State>({}, this.state, state)
      this.location = extend(
        {},
        this.location,
        to ? useParsePath(useHref(to)) : null
      )
      this.history.replace(to ? useHref(to) : null, nextState)
    }
  }

  addHook<T extends keyof RouterHooks>(
    type: T,
    listener: SetItem<RouterHooks[T]>
  ) {
    this.hooks[type].add(listener as any)
  }

  removeHook<T extends keyof RouterHooks>(
    type: T,
    listener: SetItem<RouterHooks[T]>[]
  ) {
    listener.forEach((item) => {
      this.hooks[type].delete(item as any)
    })
  }

  navigation(fromPathName: string, toPathName: string) {
    const from = getTargetRoute(
      generateRouteBranch(this.nestedRoutes, fromPathName, this.base)
    )
    const to = getTargetRoute(
      generateRouteBranch(this.nestedRoutes, toPathName, this.base)
    )
    return { from, to }
  }
}
