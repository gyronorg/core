import { renderToString } from '@gyron/dom-server'
import { h, createSSRInstance, nextRender, createVNode } from '@gyron/runtime'
import { createMemoryRouter, Link, Route, Router, Routes } from '../src'

describe('SSR Router', () => {
  test('404', async () => {
    const router = createMemoryRouter()
    const { root } = createSSRInstance(
      h(() =>
        h(
          Router,
          { router: router },
          h(Routes, null, [
            h(Route, { path: '/', strict: true, element: createVNode('foo') }),
            h(Route, { path: 'bar', element: createVNode('bar') }),
            h(Route, { path: '*', element: createVNode('404') }),
          ])
        )
      )
    )
    const html = await renderToString(root)
    expect(html).toBe('<!--[-->foo<!--]-->')
  })

  test('Link Component', async () => {
    const router = createMemoryRouter()
    const { root } = createSSRInstance(
      h(
        Router,
        { router },
        h('div', null, [
          h(Link, { to: '/' }, 'Dashboard'),
          h(Link, { to: '/login' }, 'Login'),
        ])
      )
    )
    const html = await renderToString(root)
    expect(html).toBe(
      '<div><a class="" href="/">Dashboard</a><a class="" href="/login">Login</a></div>'
    )
  })

  test('Routes Component', async () => {
    const router = createMemoryRouter()
    const { root } = createSSRInstance(
      h(
        Router,
        { router: router },
        h('div', null, [
          h('div', null, [
            h(Link, { to: '/', activeClassName: 'active' }, 'page1'),
            h(Link, { to: '/page2', activeClassName: 'active' }, 'page2'),
          ]),
          h(Routes, null, [
            h(Route, {
              path: '/',
              strict: true,
              element: createVNode('page1'),
            }),
            h(Route, { path: '/page2', element: createVNode('page2') }),
          ]),
        ])
      )
    )

    await router.extra.push('/')
    await nextRender()
    const html1 = await renderToString(root)
    expect(html1).toBe(
      '<div><div><a class="active" href="/">page1</a><a class="" href="/page2">page2</a></div><!--[-->page1<!--]--></div>'
    )

    await router.extra.push('/page2')
    await nextRender()
    const html2 = await renderToString(root)
    expect(html2).toBe(
      '<div><div><a class="" href="/">page1</a><a class="active" href="/page2">page2</a></div><!--[-->page2<!--]--></div>'
    )
  })

  test('Route contains Link', async () => {
    const router = createMemoryRouter()
    const { root } = createSSRInstance(
      h(() =>
        h(
          Router,
          { router: router },
          h(Routes, null, [
            h(Route, {
              path: '/',
              strict: true,
              element: h(Link, { to: '/' }, 'foo'),
            }),
          ])
        )
      )
    )
    const html = await renderToString(root)
    expect(html).toBe('<!--[--><a class="" href="/">foo</a><!--]-->')
  })
})
