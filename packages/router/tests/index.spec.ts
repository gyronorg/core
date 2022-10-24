import {
  createInstance,
  createVNode,
  h,
  Instance,
  nextRender,
} from '@gyron/runtime'
import {
  createMemoryRouter,
  generateQuery,
  onBeforeRouteUpdate,
  Outlet,
  Redirect,
  Route,
  Routes,
  Router,
  useMatch,
  useParams,
  useQuery,
  useParsePath,
  useRoute,
  useRoutes,
  createBrowserRouter,
} from '../src'

describe('next', () => {
  const container = document.createElement('div')
  const router = createMemoryRouter()
  let app: Instance

  beforeEach(() => {
    return router.extra.replace('/')
  })

  afterEach(() => {
    app?.destroy()
  })

  test('route', async () => {
    app = createInstance(
      h(() => {
        return h(
          Router,
          { router: router },
          h(Routes, null, [
            h(Route, { path: '', strict: true, element: createVNode('') }),
            h(Route, { path: 'foo', element: createVNode('foo') }),
          ])
        )
      })
    ).render(container)
    expect(container.innerHTML).toBe('')
    await router.extra.push('/foo')
    await nextRender()
    expect(container.innerHTML).toBe('foo')
  })

  test('redirect', async () => {
    app = createInstance(
      h(() => {
        return h(
          Router,
          { router: router },
          h(Routes, null, [
            h(Redirect, { path: '', redirect: 'foo' }),
            h(Route, { path: 'foo', element: createVNode('foo') }, [
              h(Redirect, { path: 'baz', redirect: 'bar' }),
              h(Route, { path: 'bar', element: createVNode('bar') }),
            ]),
          ])
        )
      })
    ).render(container)
    expect(container.innerHTML).toBe('foo')
    expect(router.extra.path).toBe('/foo')
    await router.extra.push('')
    expect(router.extra.path).toBe('/foo')
    await router.extra.push('/foo/baz')
    expect(router.extra.path).toBe('/foo/bar')
  })

  test('nested route', async () => {
    app = createInstance(
      h(() => {
        return h(
          Router,
          { router: router },
          h(Routes, null, [
            h(
              Route,
              {
                path: '',
                element: h(() => {
                  return h('div', null, h(Outlet))
                }),
              },
              [
                h(
                  Route,
                  {
                    path: 'foo',
                    element: h(() => {
                      return h('span', null, h(Outlet))
                    }),
                  },
                  h(Route, { path: 'baz', element: createVNode('baz') })
                ),
                h(Route, { path: 'bar', element: createVNode('bar') }),
              ]
            ),
          ])
        )
      })
    ).render(container)
    await router.extra.push('/')
    expect(container.innerHTML).toBe('<div></div>')
    await router.extra.push('/foo')
    await nextRender()
    expect(container.innerHTML).toBe('<div><span></span></div>')
    await router.extra.push('/foo/baz')
    await nextRender()
    expect(container.innerHTML).toBe('<div><span>baz</span></div>')
    await router.extra.push('/bar')
    await nextRender()
    expect(container.innerHTML).toBe('<div>bar</div>')
  })

  test('404 route', async () => {
    app = createInstance(
      h(() => {
        return h(
          Router,
          { router: router },
          h(Routes, null, [
            h(Route, { path: '*', element: createVNode('404') }),
            h(
              Route,
              {
                path: 'foo',
                element: h(() => {
                  return h('span', null, h(Outlet))
                }),
              },
              h(Route, { path: '*', element: createVNode('in foo 404') })
            ),
            h(Route, {
              path: '',
              strict: true,
              element: createVNode(''),
            }),
          ])
        )
      })
    ).render(container)
    expect(container.innerHTML).toBe('')
    await router.extra.push('/bar')
    await nextRender()
    expect(container.innerHTML).toBe('404')
    await router.extra.push('/foo/baz')
    await nextRender()
    expect(container.innerHTML).toBe('<span>in foo 404</span>')
  })

  test('match params and once call setup', async () => {
    const executeOnce = jest.fn()
    app = createInstance(
      h(() => {
        return h(
          Router,
          { router: router },
          h(Routes, null, [
            h(
              Route,
              { path: '', element: h(Outlet) },
              h(Route, {
                path: ':id',
                element: h(() => {
                  const params = useParams()
                  executeOnce()
                  return () => {
                    return h('span', null, params.id)
                  }
                }),
              })
            ),
          ])
        )
      })
    ).render(container)
    expect(container.innerHTML).toBe('')
    await router.extra.push('/foo')
    await nextRender()
    expect(container.innerHTML).toBe('<span>foo</span>')
    expect(executeOnce).toHaveBeenCalledTimes(1)
    await router.extra.push('/bar')
    await nextRender()
    expect(container.innerHTML).toBe('<span>bar</span>')
    expect(executeOnce).toHaveBeenCalledTimes(1)
  })

  test('no element layout', async () => {
    app = createInstance(
      h(() => {
        return h(
          Router,
          { router: router },
          h(Routes, null, [
            h(
              Route,
              { path: '' },
              h(Route, {
                path: 'foo',
                element: createVNode('foo'),
              })
            ),
          ])
        )
      })
    ).render(container)
    await router.extra.replace('/foo')
    await nextRender()
    expect(container.innerHTML).toBe('foo')
  })

  test('useRoutes hook', async () => {
    app = createInstance(
      h(() => {
        return h(
          Router,
          { router: router },
          useRoutes([
            {
              path: '',
              element: createVNode('foo'),
            },
          ])
        )
      })
    ).render(container)
    expect(container.innerHTML).toBe('foo')
  })

  test('useMatch', async () => {
    app = createInstance(
      h(() => {
        return h(
          Router,
          { router: router },
          h(Routes, null, [
            h(Route, { path: '', strict: true, element: createVNode('') }),
            h(Route, {
              path: 'foo',
              element: h(() => String(useMatch('/foo'))),
            }),
          ])
        )
      })
    ).render(container)
    await router.extra.push('/foo')
    await nextRender()
    expect(container.innerHTML).toBe('true')
  })

  test('useParsePath', () => {
    const structured = useParsePath('/user/admin?d=1#footer')
    expect(structured.hash).toBe('#footer')
    expect(structured.pathname).toBe('/user/admin')
    expect(structured.search).toBe('?d=1')
  })

  test('in component use Route', () => {
    let title: string
    app = createInstance(
      h(() => {
        return h(
          Router,
          { router: router },
          h(Routes, null, [
            h(Route, {
              path: '',
              strict: true,
              element: h(() => {
                const route = useRoute()
                title = route.value.meta.title
                return createVNode('')
              }),
              meta: { title: 'foo' },
            }),
          ])
        )
      })
    ).render(container)
    expect(title).toBe('foo')
  })

  test('on before update', async () => {
    const beforeUpdate = jest.fn()
    app = createInstance(
      h(() => {
        return h(
          Router,
          { router: router },
          h(Routes, null, [
            h(Route, {
              path: ':id',
              element: h(() => {
                onBeforeRouteUpdate(beforeUpdate)
                return () => createVNode('')
              }),
            }),
            h(Route, {
              path: '/baz',
            }),
          ])
        )
      })
    ).render(container)
    await router.extra.push('/foo')
    await nextRender()
    expect(beforeUpdate).toHaveBeenCalledTimes(0)
    await router.extra.push('/bar')
    expect(beforeUpdate).toHaveBeenCalledTimes(1)
    await router.extra.push('/baz')
    expect(beforeUpdate).toHaveBeenCalledTimes(1)
  })

  test('query', () => {
    const { id, from } = generateQuery('/foo?id=admin&from=gyron.js')
    expect(id).toBe('admin')
    expect(from).toBe('gyron.js')
  })

  test('query in component', async () => {
    app = createInstance(
      h(() => {
        return h(
          Router,
          { router: router },
          h(Routes, null, [
            h(Route, {
              path: '',
              element: h(() => {
                const query = useQuery()
                return () => {
                  return h('span', null, query.id)
                }
              }),
            }),
          ])
        )
      })
    ).render(container)
    await router.extra.push('/foo?id=admin')
    expect(container.innerHTML).toBe('<span>admin</span>')
    await router.extra.push('/foo?id=visitor')
    expect(container.innerHTML).toBe('<span>visitor</span>')
  })

  test('router not set base', async () => {
    const router = createMemoryRouter()
    await router.extra.push('/console/index')
    await router.extra.push('component')
    expect(router.extra.path).toBe('/console/component')
  })

  test('router set base', async () => {
    const router = createMemoryRouter({ base: '/console' })
    await router.extra.push('/index')
    expect(router.extra.path).toBe('/console/index')
    await router.extra.push('component')
    expect(router.extra.path).toBe('/console/component')
  })

  test('replace state default location', async () => {
    location.hash = 'gyron'
    const router = createBrowserRouter()
    expect(router.extra.location.hash).toBe('#gyron')
  })

  test('router render', async () => {
    const fn = jest.fn((route) => {
      return route.extra.element
    })
    const router = createMemoryRouter({
      render: fn,
    })
    createInstance(
      h(
        Router,
        { router },
        h(Routes, {}, [
          h(Route, { path: '', strict: true, element: createVNode('gyron 1') }),
          h(Route, { path: 'foo', element: createVNode('gyron 2') }),
        ])
      )
    ).render(container)
    expect(container.innerHTML).toBe('gyron 1')
    expect(fn).toHaveBeenCalledTimes(1)
    await router.extra.push('/foo')
    expect(container.innerHTML).toBe('gyron 2')
    expect(fn).toHaveBeenCalledTimes(2)
  })
})
