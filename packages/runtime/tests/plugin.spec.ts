import { noop } from '@gyron/shared'
import { createInstance, createPlugin, h, useRootContext } from '../src'

describe('plugin', () => {
  const container = document.createElement('div')

  beforeEach(() => {
    container.innerHTML = ''
  })

  test('plugin', () => {
    const state = {
      a: 0,
    }
    const plugin = createPlugin({
      extra: state,
      install(instance) {
        const context = instance.root.context
        context.set('state', state)
      },
    })
    expect(plugin.extra).toBe(state)
    createInstance(
      h(() => {
        const context = useRootContext()
        return () =>
          h('div', {
            onClick() {
              const state = context.get('state')
              state.a = 1
            },
          })
      })
    )
      .use(plugin)
      .render(container)

    container.querySelector('div').click()
    expect(state.a).toBe(1)
  })

  test('invalidate', () => {
    console.warn = noop
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const plugin = createPlugin({})
    expect(plugin).toBe(null)
    createInstance(
      h(() => {
        const context = useRootContext()
        expect([...context.keys()].length).toBe(0)
        return h('div')
      })
    )
      .use(plugin)
      .render(container)
  })
})
