import {
  createInstance,
  h,
  registerErrorHandler,
  useInject,
  registerWarnHandler,
  nextRender,
  manualErrorHandler,
  getCurrentComponent,
  manualWarnHandler,
} from '../src'
import { ErrorBoundary } from '../src/ErrorBoundary'

describe('Handler Error', () => {
  const container = document.createElement('div')

  beforeEach(() => {
    container.innerHTML = ''
  })

  test('warn', () => {
    const fn = jest.fn()
    createInstance(
      h(() => {
        registerWarnHandler(fn)
        useInject()('a')

        return null
      })
    ).render(container)

    expect(fn).toHaveBeenCalledTimes(1)
  })

  test('error to warn stack', () => {
    const fn = jest.fn(({ stack }) => {
      expect(stack).toContain('Error: Uncaught exceptions')
    })
    createInstance(
      h(() => {
        registerWarnHandler(fn)
        const component = getCurrentComponent()
        manualWarnHandler(new Error('Uncaught exceptions'), component)

        return h('div')
      })
    ).render(container)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  test('error to warn stack', () => {
    const fn = jest.fn()
    const warn = console.warn
    console.warn = fn
    createInstance(
      h(() => {
        const component = getCurrentComponent()
        manualWarnHandler(new Error('Uncaught exceptions'), component)

        return h('div')
      })
    ).render(container)
    expect(fn).toHaveBeenCalledTimes(1)
    console.warn = warn
  })

  test('error', () => {
    const fn = jest.fn()
    createInstance(
      h(() => {
        registerErrorHandler(({ message }) => {
          fn()
          expect(message).toBe('Error: Uncaught exceptions')
        })
        throw new Error('Error: Uncaught exceptions')
      })
    ).render(container)

    expect(fn.mock.calls.length).toBe(1)
  })

  test('error no register', () => {
    const fn = jest.fn()
    const error = console.error
    console.error = fn
    createInstance(
      h(() => {
        throw new Error('Error: Uncaught exceptions')
      })
    ).render(container)
    expect(fn).toHaveBeenCalledTimes(1)
    console.error = error
  })

  test('ErrorBoundary', async () => {
    createInstance(
      h(
        ErrorBoundary,
        {
          fallback: h('div', 'Error occurred, downgraded rendering'),
        },
        h(() => {
          throw new Error('Uncaught exceptions')
        })
      )
    ).render(container)

    await nextRender()
    expect(container.innerHTML).toBe(
      '<div>Error occurred, downgraded rendering</div>'
    )
  })

  test('dynamic error boundary UI', async () => {
    createInstance(
      h(
        ErrorBoundary,
        {
          fallback: h(({ message }) => {
            return h('div', 'Error occurred, downgraded rendering. ' + message)
          }),
        },
        h(() => {
          throw new Error('Uncaught exceptions')
          return h('div', '')
        })
      )
    ).render(container)

    await nextRender()
    expect(container.innerHTML).toBe(
      '<div>Error occurred, downgraded rendering. Uncaught exceptions</div>'
    )
  })

  test('manual handler component', async () => {
    const fn = jest.fn()
    createInstance(
      h(() => {
        const component = getCurrentComponent()
        registerErrorHandler(({ message }) => {
          fn()
          expect(message).toBe('Error: Uncaught exceptions')
        })
        Promise.reject('Error: Uncaught exceptions').catch((e) => {
          manualErrorHandler(e, component)
        })
        return h('div', '')
      })
    ).render(container)
    await Promise.resolve()
    expect(fn.mock.calls.length).toBe(1)
  })

  test('manual handler to ErrorBoundary', async () => {
    createInstance(
      h(
        ErrorBoundary,
        {
          fallback: h(({ message }) => h('div', null, message)),
        },
        h(() => {
          const component = getCurrentComponent()
          Promise.reject(new Error('Error: Uncaught exceptions')).catch((e) => {
            manualErrorHandler(e, component)
          })
          return h('div', 'success')
        })
      )
    ).render(container)
    expect(container.innerHTML).toBe('<div>success</div>')
    await Promise.resolve()
    await nextRender()
    expect(container.innerHTML).toBe('<div>Error: Uncaught exceptions</div>')
  })
})
