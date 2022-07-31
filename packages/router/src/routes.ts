import {
  cloneVNode,
  VNode,
  FC,
  getCurrentComponent,
  h,
  provide,
  useProvide,
  useReactive,
} from '@gyron/runtime'
import { extend } from '@gyron/shared'
import { sync } from '@gyron/sync'
import {
  TypeOutlet,
  TypeOutletRaw,
  TypeParams,
  TypeQuery,
  useRoute,
  useRouter,
} from './hooks'
import { generateNestedRoutes, generateRouteBranch } from './matches'
import { RouteRecord } from './route'

export interface RoutesRecord {
  nestedRoutes: RouteRecord[]
  matchRouteBranch: RouteRecord[]
  params: object
  query: object
}

export function generateParams(matchRouteBranch: RouteRecord[]) {
  const params = {}
  const nodes = matchRouteBranch.slice()
  while (nodes.length) {
    const node = nodes.pop()
    extend(params, node.extra.params)
    if (node.extra.matched) {
      nodes.push(...node.extra.matched.slice())
    }
  }
  return params
}

export function generateQuery(fullPath: string): { [k: string]: string } {
  const params = new URL(fullPath, 'https://gyron.io').searchParams
  return [...params.entries()].reduce((params, [key, value]) => {
    params[key] = value
    return params
  }, {})
}

const Transfer = FC<{ route: RouteRecord }>(function Transfer({ route }) {
  const component = getCurrentComponent()
  const router = useRouter()
  const props: TypeOutletRaw = {
    matches: route.extra.matched,
    depth: route.extra.depth,
  }
  const { element, regexpPath, matchFromRedirect: shouldRedirect } = route.extra

  provide(component, TypeOutlet, props)

  if (shouldRedirect) {
    // if the current branch is redirected from a Redirect component, the route needs to be updated
    router.replaceState(regexpPath, {
      redirect: regexpPath,
    })
  }

  if (element) {
    return cloneVNode(element)
  }

  return route.extra.matched.map((route) => {
    return h(Transfer, { route })
  })
})

export function renderRoute(matchRouteBranch: RouteRecord[]) {
  return matchRouteBranch.map((route) => {
    return h(Transfer, { route })
  })
}

export const Routes = FC<{
  routes?: RouteRecord[]
}>(function Routes() {
  const provide = useProvide()
  const router = useRouter()

  const route = useRoute()
  const params = useReactive({})
  const query = useReactive({})
  provide(TypeParams, params)
  provide(TypeQuery, query)

  return ({ children, routes }) => {
    const nestedRoutes = routes
      ? routes
      : generateNestedRoutes(children as VNode)
    const matchRouteBranch = generateRouteBranch(
      nestedRoutes,
      router.path,
      router.base
    )
    router.nestedRoutes = nestedRoutes
    router.matchRouteBranch = matchRouteBranch

    route.value = router.currentRoute

    sync(params, generateParams(matchRouteBranch))
    sync(query, generateQuery(router.fullPath))

    if (__DEV__) {
      router.scene.push({
        nestedRoutes: nestedRoutes,
        matchRouteBranch: matchRouteBranch,
        params: params,
        query: query,
      } as RoutesRecord)
    }

    return renderRoute(matchRouteBranch)
  }
})
