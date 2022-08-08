import { h, Primitive, useInject, usePlugin } from '@gyron/runtime'
import { isString, isUndefined } from '@gyron/shared'
import { createPath, parsePath, To } from 'history'
import { matchPath, normalizeRoutes } from './matches'
import { RouteRecord, RouteRecordConfig } from './route'
import { RouterBase } from './router'
import { Routes } from './routes'

export const TypeRouter = Symbol.for('gyron.router')
export const TypeRoute = Symbol.for('gyron.route')
export const TypeOutlet = Symbol.for('gyron.outlet')
export const TypeParams = Symbol.for('gyron.params')
export const TypeQuery = Symbol.for('gyron.query')

export interface TypeOutletRaw {
  matches: RouteRecord[]
  depth: number
}

export type TypeParamsRaw = Record<string, any>

/**
 * The useHref can be used anywhere and can be used to convert To types to string
 */
export function useHref(to: To) {
  if (isUndefined(to)) {
    return ''
  }
  return isString(to) ? to : createPath(to)
}

/**
 * The useParsePath can be used anywhere and convert a string to a Path type
 */
export function useParsePath(path: string) {
  if (path === '') {
    return {
      pathname: '',
    }
  }
  return parsePath(path)
}

/**
 * The useMatch determines whether the incoming path has been matched
 */
export function useMatch(path: string) {
  const router = useRouter()
  const matchRouteBranch = useMatchesBranch()
  const match = find(matchRouteBranch, path, router.base)
  return Boolean(match)
}

/**
 * The useMatchesBranch returns a matching route map that update when the route changes
 */
export function useMatchesBranch() {
  const router = useRouter()
  return router.matchRouteBranch
}

/**
 * The useRouter returns a Router instance, which contains some methods for routing operations, such as push, replace.
 *
 * The internal state is divided into two types. Fields starting with unresponsive are not responsive,
 *
 * which means that when a change occurs, no automatic update is triggered.
 */
export function useRouter() {
  const context = usePlugin()
  const router: RouterBase = context.get(TypeRouter)
  if (!router) {
    throw new Error(
      'Please use(router) or <Router></Router> to register the router, and then use the hook function provided by dox'
    )
  }
  return router
}

/**
 * Get the matching Route, return null if no Route is matched
 */
export function useRoute() {
  const context = usePlugin()
  const route: Primitive<RouteRecord> = context.get(TypeRoute)
  if (!route.value) {
    console.warn(
      "No matching route is found, and it could also be the cause of useRoute's scope."
    )
  }
  return route
}

/**
 * The useOutlet is used to pass the element of the child route, which contains the matched route and the depth of the route
 */
export function useOutlet() {
  const inject = useInject()
  const matchRoutes = inject<TypeOutletRaw>(TypeOutlet)
  return matchRoutes
}

/**
 * The useParams hook returns an object of key/value pairs of the dynamic params from the current URL that were matched by the <Route path>.
 *
 * Child routes inherit all params from their parent routes.
 */
export function useParams() {
  const inject = useInject()
  return inject<TypeParamsRaw>(TypeParams)
}

export function useQuery() {
  const inject = useInject()
  return inject<TypeParamsRaw>(TypeQuery)
}

/**
 * The useRoutes is to provide the user with the ability to create routes in json form, which maintains the same behavior as Routes.
 */
export function useRoutes(routes: RouteRecordConfig[]) {
  const nestedRoutes = normalizeRoutes(routes)
  return h(Routes, { routes: nestedRoutes })
}

function find(
  routes: RouteRecord[],
  path: string,
  base: string
): RouteRecord | null {
  for (let i = 0, len = routes.length; i < len; i++) {
    const route = routes[i]
    if (matchPath(route, path, base)) {
      return route
    }
    if (route.extra.children.length > 0) {
      return find(route.extra.children, path, base)
    }
  }
  return null
}
