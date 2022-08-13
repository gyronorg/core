import {
  createInstance,
  useRef,
  createText,
  h,
  Instance,
  nextRender,
} from '@gyron/runtime'
import { createMemoryRouter, Link, Route, Router, Routes } from '../src'
import { generate } from './each.spec'

describe('Link', () => {
  const container = document.createElement('div')
  const router = createMemoryRouter()
  let app: Instance

  beforeEach(() => {
    router.extra.replace('/')
    container.innerHTML = ''
  })

  afterEach(() => {
    app.destroy()
  })

  test('active class and style', async () => {
    const router = createMemoryRouter()
    app = createInstance(
      h(() =>
        h(Router, { router: router }, [
          h(Link, {
            to: '/foo',
            activeClassName: 'active',
            activeStyle: 'color: red',
          }),
          h(Link, {
            to: '/bar',
            activeClassName: 'active',
            activeStyle: 'color: red',
          }),
        ])
      )
    ).render(container)
    router.extra.nestedRoutes = generate(['/', '/foo', '/bar'])
    expect(container.innerHTML).toBe('<a href="/foo"></a><a href="/bar"></a>')
    await router.extra.push('/foo')
    await nextRender()
    expect(container.innerHTML).toBe(
      '<a href="/foo" class="active" style="color: red"></a><a href="/bar"></a>'
    )
    await router.extra.push('/bar')
    await nextRender()
    expect(container.innerHTML).toBe(
      '<a href="/foo"></a><a href="/bar" class="active" style="color: red"></a>'
    )
  })

  test('Link component render and click push or replace', async () => {
    const router = createMemoryRouter()
    const LinkRef = useRef()
    app = createInstance(
      h(() => {
        return h(
          Router,
          { router: router },
          h(Routes, null, [
            h(Route, {
              path: '/',
              strict: true,
              element: h(() => {
                return [
                  h(Link, {
                    ref: LinkRef,
                    to: '/foo',
                  }),
                  h(Link, {
                    to: {
                      pathname: '/bar',
                    },
                  }),
                ]
              }),
            }),
            h(Route, { path: '/foo', element: createText('foo') }),
          ])
        )
      })
    ).render(container)
    router.extra.nestedRoutes = generate(['/', '/foo', '/bar'])
    expect(container.innerHTML).toBe('<a href="/foo"></a><a href="/bar"></a>')
    LinkRef.current.dispatchEvent(new Event('click'))
    await Promise.resolve()
    await nextRender()
    expect(router.extra.unresponsivePath).toBe('/foo')
    expect(container.innerHTML).toBe('foo')
  })
})
