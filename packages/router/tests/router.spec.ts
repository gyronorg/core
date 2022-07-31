import {
  createInstance,
  createText,
  h,
  Instance,
  nextRender,
} from '@gyron/runtime'
import { createMemoryHistory } from 'history'
import { createHashRouter, Route, Router, Routes } from '../src'

describe('Router', () => {
  const container = document.createElement('div')
  let app: Instance

  afterEach(() => {
    app.destroy()
  })

  test('router component', async () => {
    const history = createMemoryHistory()
    app = createInstance(
      h(() => {
        return h(
          Router,
          {
            history: history,
          },
          h(Routes, null, [
            h(Route, { path: '', strict: true, element: createText('') }),
            h(Route, { path: 'foo', element: createText('foo') }),
          ])
        )
      })
    ).render(container)
    expect(container.innerHTML).toBe('')
    history.push('/foo')
    await nextRender()
    expect(container.innerHTML).toBe('foo')
  })

  test('create hash router', async () => {
    const router = createHashRouter()
    app = createInstance(
      h(() => {
        return h(Routes, null, [
          h(Route, { path: '', strict: true, element: createText('') }),
          h(Route, { path: 'foo', element: createText('foo') }),
        ])
      })
    )
      .use(router)
      .render(container)
    await router.extra.push('/foo')
    await nextRender()
    expect(container.innerHTML).toBe('foo')
  })
})
