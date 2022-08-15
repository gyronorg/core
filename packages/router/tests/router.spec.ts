import {
  createInstance,
  createVNode,
  h,
  Instance,
  nextRender,
} from '@gyron/runtime'
import {
  createHashRouter,
  createMemoryRouter,
  Route,
  Router,
  Routes,
} from '../src'

describe('router', () => {
  const container = document.createElement('div')
  let app: Instance

  afterEach(() => {
    app.destroy()
  })

  test('router component', async () => {
    const router = createMemoryRouter()
    app = createInstance(
      h(() => {
        return h(
          Router,
          {
            router: router,
          },
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

  test('create hash router', async () => {
    const router = createHashRouter()
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
    await router.extra.push('/foo')
    await nextRender()
    expect(container.innerHTML).toBe('foo')
  })
})
