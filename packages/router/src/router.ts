import { FC, Primitive, useValue, getPlugins } from '@gyron/runtime'
import { isEqual, isFunction, noop } from '@gyron/shared'
import {
  createBrowserHistory,
  createHashHistory,
  createMemoryHistory,
  createPath,
  History as HHistory,
  Update as HUpdate,
  Location as HLocation,
} from 'history'
import {
  HistoryEvent,
  RouterHookAfterEach,
  RouterHookBeforeEach,
  RouterRender,
  State,
} from './event'
import { TypeRoute, TypeRouter } from './hooks'
import { RoutesRecord } from './routes'

export interface History extends HHistory {
  location: Location
}

export interface Update extends HUpdate {
  location: Location
}

export interface Location extends HLocation {
  state: Partial<State>
}

export interface RouterProps {
  router: ReturnType<typeof createRouter>
}

export interface RouterOption {
  history: History
  beforeEach: RouterHookBeforeEach
  afterEach: RouterHookAfterEach
  render: RouterRender
  base?: string
  isSSR?: boolean
}

export let pending = Promise.resolve()

export class RouterBase extends HistoryEvent {
  private _path: Primitive<string> = useValue(this.generatePath())
  private _fullPath: Primitive<string> = useValue(this.generateFullPath())

  /**
   * Serving router devtool as a snapshot of routes
   * @deprecated The scene only exists in the development environment, so developers cannot rely on this data.
   */
  public scene: RoutesRecord[] = []

  constructor(
    public history: History,
    public base = '/',
    public isSSR = false,
    public render: RouterRender
  ) {
    base = base.startsWith('/') ? base : '/' + base
    super(history, base, isSSR)

    this.history.listen(this.listener.bind(this))
  }

  get path() {
    return this.responsivePath()
  }

  get unresponsivePath() {
    return this.generatePath()
  }

  get fullPath() {
    return this.responsiveFullPath()
  }

  get unresponsiveFullPath() {
    return this.generateFullPath()
  }

  private listener({ location, action }: Update) {
    const tryRouterRerender = () => {
      this.location = location
      this.responsivePath()
      this.responsiveFullPath()
    }
    if (!isEqual(this.location, location, 'key')) {
      if (action === 'POP') {
        // the value of action is POP when the user jumps through the browser's forward/back button or uses the go method.
        const { from, to } = this.navigation(
          this.location.pathname,
          location.pathname
        )
        // uniformity with other routing methods, all using Promise
        pending = this.guards(from, to, noop, () =>
          this.replace(this.location)
        ).then((ret) => {
          if (!ret) {
            return null
          }
          tryRouterRerender()
        })
      } else {
        tryRouterRerender()
      }
    }
  }

  private responsivePath() {
    const path = this.generatePath()
    if (this._path.value !== path) {
      this._path.value = path
    }
    return this._path.value
  }

  private responsiveFullPath() {
    const fullPath = this.generateFullPath()
    if (this._fullPath.value !== fullPath) {
      this._fullPath.value = fullPath
    }
    return this._fullPath.value
  }

  private generatePath() {
    const { pathname } = this.location
    return pathname
  }

  private generateFullPath() {
    return createPath(this.location)
  }
}

export function createBrowserRouter(option: Partial<RouterOption> = {}) {
  const history = createBrowserHistory() as History
  return createRouter({
    ...option,
    history: history,
  })
}

export function createHashRouter(option: Partial<RouterOption> = {}) {
  const history = createHashHistory() as History
  return createRouter({
    ...option,
    history: history,
  })
}

export function createMemoryRouter(option: Partial<RouterOption> = {}) {
  const history = createMemoryHistory() as History
  return createRouter({
    isSSR: true,
    ...option,
    history: history,
  })
}

export function createRouter(option: Partial<RouterOption>) {
  const router = new RouterBase(
    option.history,
    option.base,
    option.isSSR,
    option.render
  )

  if (isFunction(option.beforeEach)) {
    router.addHook('beforeEach', option.beforeEach)
  }
  if (isFunction(option.afterEach)) {
    router.addHook('afterEach', option.afterEach)
  }

  return {
    name: 'router',
    extra: router,
    data: router,
  }
}

export const Router = FC<RouterProps>(function Router({ router }) {
  const plugins = getPlugins()

  const route = useValue({})
  plugins.set(TypeRouter, router.data)
  plugins.set(TypeRoute, route)

  return ({ children }) => {
    return children
  }
})
