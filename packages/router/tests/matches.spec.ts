import { createVNode, h } from '@gyron/runtime'
import {
  normalizeRoutes,
  generateNestedRoutes,
  generateRouteBranch,
  Route,
  Redirect,
  RouteRecordExtra,
  matchPath,
  matchRouteParams,
  RouteRecord,
} from '../src'

describe('matches', () => {
  test('generateNestedRoutes', () => {
    const routes = [
      h(Route, { path: 'foo', element: createVNode('foo') }),
      h(Redirect, { path: 'baz', redirect: 'foo' }),
    ]
    const nestedRoutes = generateNestedRoutes(routes)
    expect(nestedRoutes[0].path).toBe('foo')
    expect(nestedRoutes[0].extra).toEqual(
      expect.objectContaining<Partial<RouteRecordExtra>>({
        children: [],
        element: createVNode('foo'),
        regexpPath: '/foo',
      })
    )
    expect(nestedRoutes[1].extra).toEqual(
      expect.objectContaining<Partial<RouteRecordExtra>>({
        redirect: 'foo',
        strict: true,
      })
    )
  })

  test('base url', () => {
    const routes = [
      h(Route, { path: 'foo', element: createVNode('foo') }),
      h(Route, { path: 'bar', element: createVNode('bar') }),
    ]
    const nestedRoutes = generateNestedRoutes(routes)
    const matchRouteBranch = generateRouteBranch(
      nestedRoutes,
      '/base-directory/foo',
      '/base-directory'
    )
    expect(matchRouteBranch[0].extra.element).toEqual(createVNode('foo'))
  })

  test('normalizeRoutes with useRoutes', () => {
    const routesRecord = normalizeRoutes([
      {
        path: '',
        element: createVNode(''),
      },
      {
        path: 'foo',
        element: createVNode('foo'),
        children: [
          {
            path: ':id',
            element: createVNode(':id'),
          },
        ],
      },
    ])
    expect(routesRecord[1].extra.children[0].extra).toEqual(
      expect.objectContaining<Partial<RouteRecordExtra>>({
        regexpPath: '/foo/:id',
        children: [],
        element: createVNode(':id'),
      })
    )
  })

  test('matchPath and matchRouteParams', () => {
    const record: RouteRecord = {
      path: '/user/:id/detail',
      extra: {
        regexpPath: '/user/:id/detail',
        children: [],
      },
    }
    expect(matchPath(record, '/user/admin/detail', '/')).toBe(true)
    expect(matchRouteParams(record, '/user/admin/detail')).toMatchObject({
      id: 'admin',
    })
  })

  test('generateRouteBranch', () => {
    const routes = [
      h(Route, { path: 'foo', element: createVNode('foo') }),
      h(Route, {
        path: '/invoices/:id/invoice',
        element: createVNode('invoice'),
      }),
      h(
        Route,
        {
          path: 'user',
        },
        h(Route, { path: ':id' }, [
          h(Route, { path: '*', element: createVNode('user 404') }),
          h(Route, { path: 'detail' }),
        ])
      ),
      h(Route, { path: 'dashboard' }, [
        h(Route, { path: 'welcome', element: createVNode('foo') }),
        h(Redirect, { path: 'welcomes', redirect: 'welcome' }),
      ]),
      h(Route, { path: '*', element: createVNode('404') }),
      h(Redirect, { path: '/baz/foo', redirect: 'foo' }),
    ]
    const nestedRoutes = generateNestedRoutes(routes)
    let matchRouteBranch = generateRouteBranch(nestedRoutes, '/foo', '/')
    expect(matchRouteBranch[0].path).toBe('foo')
    expect(matchRouteBranch[0].extra).toMatchObject<Partial<RouteRecordExtra>>({
      matched: [],
    })

    matchRouteBranch = generateRouteBranch(
      nestedRoutes,
      '/user/admin/detail',
      '/'
    )
    expect(matchRouteBranch[0].extra.matched[0].extra.matched[0].path).toBe(
      'detail'
    )

    matchRouteBranch = generateRouteBranch(
      nestedRoutes,
      '/invoices/FFCCAA/invoice',
      '/'
    )
    expect(matchRouteBranch[0].extra.element).toEqual(createVNode('invoice'))

    matchRouteBranch = generateRouteBranch(nestedRoutes, '/ccccc/qqqq', '/')
    expect(matchRouteBranch[0].extra.element).toEqual(createVNode('404'))

    matchRouteBranch = generateRouteBranch(
      nestedRoutes,
      '/user/admin/test',
      '/'
    )
    expect(
      matchRouteBranch[0].extra.matched[0].extra.matched[0].extra.element
    ).toEqual(createVNode('user 404'))

    matchRouteBranch = generateRouteBranch(nestedRoutes, '/baz/foo', '/')
    expect(matchRouteBranch[0].path).toBe('foo')
  })

  test('nested 404', () => {
    const routes = [
      h(Route, { path: 'dashboard' }, [
        h(Route, { path: 'welcome', element: createVNode('foo') }),
        h(Redirect, { path: 'welcomes', redirect: 'welcome' }),
      ]),
    ]
    const nestedRoutes = generateNestedRoutes(routes)
    const matchRouteBranch = generateRouteBranch(
      nestedRoutes,
      '/dashboard/welcomes',
      '/'
    )
    expect(matchRouteBranch[0].extra.matched.length).toBe(1)
    expect(matchRouteBranch[0].extra.matched[0].path).toBe('welcome')
  })

  test('index route', () => {
    const routes = [
      h(Route, { path: 'dashboard' }, [
        h(Route, { index: true, element: createVNode('welcome') }),
        h(Route, { path: 'form', element: createVNode('form') }),
        h(Route, { path: '*', element: createVNode('404') }),
      ]),
    ]
    const nestedRoutes = generateNestedRoutes(routes)
    let matchRouteBranch = generateRouteBranch(nestedRoutes, '/dashboard', '/')
    expect(matchRouteBranch[0].extra.matched[0].extra.element).toEqual(
      createVNode('welcome')
    )

    matchRouteBranch = generateRouteBranch(nestedRoutes, '/dashboard/form', '/')
    expect(matchRouteBranch[0].extra.matched[0].extra.element).toEqual(
      createVNode('form')
    )

    matchRouteBranch = generateRouteBranch(nestedRoutes, '/dashboard/test', '/')
    expect(matchRouteBranch[0].extra.matched[0].extra.element).toEqual(
      createVNode('404')
    )
  })

  test('redirect to root path', () => {
    const routes = [
      h(Route, { path: 'foo', element: createVNode('foo') }),
      h(Route, { path: 'dashboard' }, [
        h(Route, { index: true, element: createVNode('dashboard') }),
        h(Route, { path: 'login', element: createVNode('login') }),
        h(Redirect, { path: 'welcome', redirect: '/foo' }),
      ]),
      h(Redirect, { path: '/baz/foo', redirect: '/dashboard' }),
      h(Redirect, { path: '/role', redirect: '/dashboard/login' }),
    ]
    const nestedRoutes = generateNestedRoutes(routes)
    let matchRouteBranch = generateRouteBranch(nestedRoutes, '/baz/foo', '/')
    expect(matchRouteBranch.length).toBe(1)
    expect(matchRouteBranch[0].extra.matched[0].extra.index).toBe(true)
    matchRouteBranch = generateRouteBranch(
      nestedRoutes,
      '/dashboard/welcome',
      '/'
    )
    expect(matchRouteBranch.length).toBe(1)
    expect(matchRouteBranch[0].extra.element).toEqual(createVNode('foo'))
    matchRouteBranch = generateRouteBranch(nestedRoutes, '/role', '/')
    expect(matchRouteBranch.length).toBe(1)
    expect(matchRouteBranch[0].extra.matched[0].extra.element).toEqual(
      createVNode('login')
    )
  })

  test('redirect nested least three', () => {
    const routes = [
      h(Route, { path: 'foo', element: createVNode('foo') }),
      h(Route, { path: 'dashboard' }, [
        h(Route, { path: 'login', element: createVNode('login') }, [
          h(Redirect, { path: 'admin', redirect: '/foo' }),
        ]),
      ]),
    ]
    const nestedRoutes = generateNestedRoutes(routes)
    const matchRouteBranch = generateRouteBranch(
      nestedRoutes,
      '/dashboard/login/admin',
      '/'
    )
    expect(matchRouteBranch.length).toBe(1)
    expect(matchRouteBranch[0].extra.element).toEqual(createVNode('foo'))
  })

  test('normalized path', () => {
    const routes = [
      h(Route, {
        path: {
          pathname: 'foo',
        },
        element: createVNode('foo'),
      }),
      h(
        Route,
        {
          path: {
            pathname: 'dashboard',
          },
        },
        [
          h(Route, { index: true, element: createVNode('foo') }),
          h(Redirect, {
            path: {
              pathname: 'welcome',
            },
            redirect: {
              pathname: '/foo',
            },
          }),
        ]
      ),
      h(Redirect, {
        path: {
          pathname: '/baz/foo',
        },
        redirect: {
          pathname: '/dashboard',
        },
      }),
    ]
    const nestedRoutes = generateNestedRoutes(routes)
    let matchRouteBranch = generateRouteBranch(nestedRoutes, '/baz/foo', '/')
    expect(matchRouteBranch[0].extra.matched[0].extra.index).toBe(true)
    matchRouteBranch = generateRouteBranch(
      nestedRoutes,
      '/dashboard/welcome',
      '/'
    )
    expect(matchRouteBranch[0].extra.element).toEqual(createVNode('foo'))
  })

  test('route priority', () => {
    const routes = [
      h(Route, { path: 'foo', element: createVNode('foo') }),
      h(Route, { path: ':id', element: createVNode(':id') }),
    ]
    const nestedRoutes = generateNestedRoutes(routes)
    const matchRouteBranch = generateRouteBranch(nestedRoutes, '/foo', '/')
    expect(matchRouteBranch[0].path).toBe('foo')
  })
})
