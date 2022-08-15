import { createInstance, createVNode, h, nextRender } from '@gyron/runtime'
import {
  createMemoryRouter,
  onAfterRouteEach,
  onBeforeRouteEach,
  Route,
  Routes,
  RouteRecord,
  Router,
} from '../src'
import {
  HookNext,
  RouterHookAfterEach,
  RouterHookBeforeEach,
} from '../src/event'

type GetParams<T> = T extends (...args: infer K) => any ? K : never

export function generate(paths?: string[]) {
  return paths.map<RouteRecord>((path) => {
    return {
      path,
      extra: {
        regexpPath: path,
        children: [],
        strict: true,
      },
    }
  })
}

describe('each', () => {
  const container = document.createElement('div')

  beforeEach(() => {
    container.innerHTML = ''
  })

  test('before each', async () => {
    const fn = jest.fn<void, GetParams<RouterHookBeforeEach>>(
      (from, to, next) => {
        next()
      }
    )
    const { extra: router } = createMemoryRouter()
    router.nestedRoutes = generate(['/', '/foo', '/bar'])
    router.addHook('beforeEach', fn)
    await router.push('/foo')
    expect(fn).toHaveBeenCalledTimes(1)
    expect(router.path).toBe('/foo')
    await router.push('/bar')
    expect(fn).toHaveBeenCalledTimes(2)
    expect(router.path).toBe('/bar')
  })

  test('after each', async () => {
    const fn = jest.fn<void, GetParams<RouterHookAfterEach>>()
    const { extra: router } = createMemoryRouter()
    router.nestedRoutes = generate(['/', '/foo'])
    router.addHook('afterEach', fn)
    await router.push('/foo')
    expect(fn).toHaveBeenCalledTimes(1)
    expect(router.path).toBe('/foo')
  })

  test('before or after in component', async () => {
    const router = createMemoryRouter()
    const after = jest.fn()
    createInstance(
      h(() => {
        onBeforeRouteEach((form, to, next) => {
          if (to.path === '/baz') {
            next(false)
          } else {
            next()
          }
        })
        onAfterRouteEach(after)
        return h(
          Router,
          { router: router },
          h(Routes, null, [
            h(Route, { path: '/', strict: true, element: createVNode('foo') }),
            h(Route, { path: '/bar', element: createVNode('bar') }),
            h(Route, { path: '/baz', element: createVNode('baz') }),
          ])
        )
      })
    ).render(container)
    expect(container.innerHTML).toBe('foo')
    await router.extra.replace('/bar')
    expect(after).toHaveBeenCalledTimes(1)
    await nextRender()
    expect(container.innerHTML).toBe('bar')
    await router.extra.replace('/baz')
    expect(after).toHaveBeenCalledTimes(1)
    await nextRender()
    expect(container.innerHTML).toBe('bar')
  })

  test('history state', async () => {
    let from: RouteRecord, to: RouteRecord
    const beforeEach = jest.fn(
      (before: RouteRecord, after: RouteRecord, next: HookNext) => {
        from = before
        to = after
        next()
      }
    )
    const { extra: router } = createMemoryRouter({
      beforeEach: beforeEach,
    })
    router.nestedRoutes = generate([
      '/',
      '/user',
      '/admin',
      '/accounts',
      '/tenant',
    ])
    await router.push('/user')
    await router.push('/admin')
    expect(from.extra.regexpPath).toBe('/user')
    expect(to.extra.regexpPath).toBe('/admin')
    expect(router.state.back).toBe('/user')
    expect(router.state.current).toBe('/admin')
    await router.push('/accounts')
    await router.back()
    expect(from.extra.regexpPath).toBe('/accounts')
    expect(to.extra.regexpPath).toBe('/admin')
    expect(router.state.forward).toBe('/accounts')
    await router.forward()
    expect(from.extra.regexpPath).toBe('/admin')
    expect(to.extra.regexpPath).toBe('/accounts')
    expect(router.state.forward).toBe(undefined)
    await router.replace('/tenant')
    expect(from.extra.regexpPath).toBe('/accounts')
    expect(to.extra.regexpPath).toBe('/tenant')
    await router.go(-2)
    expect(beforeEach).toHaveBeenCalledTimes(7)
    expect(from.path).toBe('/tenant')
    expect(to.path).toBe('/user')
  })
})
