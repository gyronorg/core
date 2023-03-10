import { warn } from '@gyron/logger'
import { VNode, isVNodeComponent } from '@gyron/runtime'
import { extend, isArray, isObject, omit, resolve } from '@gyron/shared'
import { match, parse, pathToRegexp } from 'path-to-regexp'
import { useHref } from './hooks'
import { isRedirect, RedirectProps } from './redirect'
import {
  isRoute,
  RouteFlag,
  RouteProps,
  RouteRecord,
  RouteRecordConfig,
  RouteRecordExtra,
} from './route'

function transformPath(parentPath: string, path: string) {
  if (path === '*') {
    return resolve(parentPath, '(.*)')
  }
  return resolve(parentPath, path)
}

function getRouteFlag(path: string) {
  const tokens = parse(path.replace(/\*$/, '(.*)'))
  const isRegexp = Boolean(tokens.find((token) => isObject(token)))
  if (isRegexp) {
    return RouteFlag.Regexp
  }
  return RouteFlag.Normal
}

export function normalizeRoutes(routes: RouteRecordConfig[], parentPath = '') {
  const routeRecords: RouteRecord[] = []

  for (let i = 0, len = routes.length; i < len; i++) {
    const record = routes[i]
    const regexpPath = transformPath(parentPath, useHref(record.path))

    let children = []
    if (record.children) {
      children = normalizeRoutes(record.children, regexpPath)
    }

    const route: RouteRecord = {
      path: record.path,
      meta: record.meta,
      extra: extend(omit(record, ['path', 'meta']), {
        flag: getRouteFlag(useHref(record.path)),
        children: children,
        regexpPath: regexpPath,
        parentPath: parentPath,
      }),
    }

    routeRecords.push(route)
  }

  return routeRecords
}

export function generateNestedRoutes(
  children: VNode | VNode[],
  parentPath = ''
) {
  const routeRecords: RouteRecord[] = []

  children = isArray(children) ? children : [children]

  for (let i = 0, len = children.length; i < len; i++) {
    const component = children[i]

    if (isArray(component)) {
      // The fragment component is supported, but the child element can also only be Route or Redirect
      routeRecords.push(...generateNestedRoutes(component, parentPath))
      continue
    }

    const props = extend<RouteProps | RedirectProps, any>(
      {},
      component.props || {}
    )

    if (isRoute(component)) {
      const record = props as RouteProps
      const regexpPath = transformPath(parentPath, useHref(record.path))

      const route: RouteRecord = {
        path: record.path,
        meta: record.meta,
        extra: extend<RouteRecordExtra, Partial<RouteRecordExtra>[]>(
          omit(record, ['path', 'meta']),
          {
            flag: getRouteFlag(useHref(record.path)),
            regexpPath: regexpPath,
            parentPath: parentPath,
          }
        ),
      }

      if (component.children) {
        route.extra.children = generateNestedRoutes(
          component.children as VNode,
          regexpPath
        )
      } else {
        route.extra.children = []
      }
      routeRecords.push(route)
    } else if (isRedirect(component)) {
      const record = props as RedirectProps
      const regexpPath = transformPath(parentPath, useHref(record.path))

      const route: RouteRecord = {
        path: record.path,
        extra: extend<RouteRecordExtra, Partial<RouteRecordExtra>[]>(
          omit(record, 'path'),
          {
            strict: true,
            flag: RouteFlag.Redirect,
            regexpPath: regexpPath,
            parentPath: parentPath,
            children: [],
          }
        ),
      }
      routeRecords.push(route)
    } else {
      warn(
        'router',
        'Only the <Route> component is allowed under the <Routes> component.\nbut you have used the',
        isVNodeComponent(component) ? component.type : String(component.type)
      )
    }
  }

  return routeRecords
}

export function matchPath(route: RouteRecord, path: string, base: string) {
  const relativePath = path
    .replace(new RegExp(`^${base}`), '/')
    .replace('//', '/')
  const regexp = pathToRegexp(route.extra.regexpPath, [], {
    end: Boolean(route.extra.strict || route.extra.index),
    sensitive: route.extra.sensitive,
  })
  return regexp.test(relativePath)
}

export function matchRouteParams(route: RouteRecord, path: string) {
  try {
    const matchResult = match(route.extra.regexpPath)(path)
    if (matchResult) {
      return matchResult.params
    }
  } catch (_) {
    return {}
  }
}

export function patchMatchesRoute(matches: RouteRecord[]) {
  /**
   * when more than one route is matched, * has the lowest priority,
   * followed by regular routes, with length greater than 1 ensuring that at least one route is matched
   */
  const excludeMisMatch = matches.filter((route) => route.path !== '*')
  if (excludeMisMatch.length > 1) {
    return excludeMisMatch.filter(
      (route) => route.extra.flag !== RouteFlag.Regexp
    )
  }
  return excludeMisMatch
}

export function mergeFromRedirect(route: RouteRecord): RouteRecord {
  if (route.extra.matched.length > 0) {
    route.extra.matched = route.extra.matched.map(mergeFromRedirect)
  }
  route.extra.matchFromRedirect = true
  return extend({}, route)
}

export function getTargetRoute(routes: RouteRecord[]): RouteRecord {
  const route = routes[0]
  if (route && route.extra.matched.length > 0) {
    return getTargetRoute(route.extra.matched)
  }
  return route
}

function removeMatchRedirect(matches: RouteRecord[]) {
  const result: RouteRecord[] = []
  const temp: Map<RouteRecord, boolean> = new Map()

  while (matches.length) {
    const match = matches.pop()
    if (match.extra.depth === 0) {
      // initialize the root data and collect the root path into a temporary variable
      match.extra.root = match
      temp.set(match, true)
    }
    if (match.extra.matched.length > 0) {
      matches.push(
        ...match.extra.matched.map((subMatch) => {
          subMatch.extra.root = match.extra.root
          return subMatch
        })
      )
    }
    if (match.extra.flag === RouteFlag.Redirect) {
      // exclude routes with redirects under the current path
      temp.set(match.extra.root, false)
    }
  }

  for (const [match, value] of temp.entries()) {
    if (value) {
      result.push(match)
    }
  }

  return result
}

export function matchRouteBranch(
  route: RouteRecord,
  path: string,
  base: string,
  depth = 0,
  nestedRoutes: RouteRecord[],
  parentRoutes: RouteRecord[],
  matchesRoot: RouteRecord[]
) {
  const matches: RouteRecord[] = []

  route.extra.depth = depth
  route.extra.params = {}

  if (matchPath(route, path, base)) {
    if (route.extra.flag === RouteFlag.Redirect) {
      const redirect = useHref(route.extra.redirect)
      // when matching a route with the redirect attribute, you need to match the redirect route again
      if (redirect[0] === '/') {
        const redirectMatches = generateRouteBranch(
          nestedRoutes,
          redirect,
          base
        ).map(mergeFromRedirect)
        matchesRoot.push(...redirectMatches)
        // marked so that the current branch can be deleted at the end of the recursion
        matches.push(route)
      } else {
        const redirectMatches = generateRouteBranch(
          parentRoutes,
          transformPath(route.extra.parentPath, redirect),
          base
        ).map(mergeFromRedirect)
        matches.push(...redirectMatches)
      }
    } else {
      const params = matchRouteParams(route, path)
      extend(route.extra.params, params)
      matches.push(route)
    }
  }

  let matchesRouteChildren: RouteRecord[] = []
  for (let i = 0, len = route.extra.children.length; i < len; i++) {
    const childrenRoute = route.extra.children[i]
    matchesRouteChildren.push(
      ...matchRouteBranch(
        childrenRoute,
        path,
        base,
        depth + 1,
        nestedRoutes,
        route.extra.children,
        matchesRoot
      )
    )
  }

  if (matchesRouteChildren.length > 1) {
    matchesRouteChildren = patchMatchesRoute(matchesRouteChildren)
  }

  route.extra.matched = matchesRouteChildren

  return depth === 0 ? removeMatchRedirect(matches) : matches
}

export function generateRouteBranch(
  nestedRoutes: RouteRecord[],
  path: string,
  base: string
) {
  const matches: RouteRecord[] = []
  for (let i = 0, len = nestedRoutes.length; i < len; ++i) {
    matches.push(
      ...matchRouteBranch(
        nestedRoutes[i],
        path,
        base,
        0,
        nestedRoutes,
        nestedRoutes,
        matches
      )
    )
  }
  if (matches.length > 1) {
    return patchMatchesRoute(matches)
  }
  return matches
}
