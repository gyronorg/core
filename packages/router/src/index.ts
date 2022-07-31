export { Link } from './link'
export { Routes, generateParams, generateQuery } from './routes'
export { Route } from './route'
export {
  Router,
  createRouter,
  createBrowserRouter,
  createHashRouter,
  createMemoryRouter,
} from './router'
export {
  useHref,
  useParsePath,
  useRouter,
  useRoute,
  useRoutes,
  useParams,
  useQuery,
  useOutlet,
  useMatch,
} from './hooks'
export { Redirect } from './redirect'
export {
  onBeforeRouteEach,
  onAfterRouteEach,
  onBeforeRouteUpdate,
  onAfterRouteUpdate,
} from './lifecycle'
export { Outlet } from './outlet'
export {
  normalizeRoutes,
  generateNestedRoutes,
  matchRouteBranch,
  generateRouteBranch,
  matchPath,
  matchRouteParams,
} from './matches'

export type { RouterOption, RouterProps } from './router'
export type {
  RouteProps,
  RouteRecordConfig,
  RouteRecord,
  RouteRecordExtra,
} from './route'
export type {
  RouterHookBeforeEach,
  RouterHookAfterEach,
  RouterHookListener,
  HookRecord,
} from './event'
export type { RedirectProps } from './redirect'
export type { To, Location, History, Blocker } from 'history'
