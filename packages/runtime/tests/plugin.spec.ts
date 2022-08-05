import { noop } from '@gyron/shared'
import { createInstance, createPlugin, h, usePlugin } from '../src'
import { plugins } from '../src/plugin'

describe('plugin', () => {
  const container = document.createElement('div')

  beforeEach(() => {
    container.innerHTML = ''
    plugins.clear()
  })

  test('create state plugin', () => {
    const state = {
      a: 0,
    }
    const plugin = createPlugin({
      extra: state,
      data: state,
    })
    const plugins = usePlugin()
    plugins.set('state', state)
    expect(plugin.extra).toBe(state)
    createInstance(
      h(() => {
        const context = usePlugin()
        return () =>
          h('div', {
            onClick() {
              const state = context.get('state')
              state.a = 1
            },
          })
      })
    ).render(container)

    container.querySelector('div').click()
    expect(state.a).toBe(1)
  })

  test('invalidate plugin', () => {
    console.warn = noop
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const plugin = createPlugin({})
    expect(plugin).toBe(null)
    createInstance(
      h(() => {
        const context = usePlugin()
        expect([...context.keys()].length).toBe(0)
        return h('div')
      })
    ).render(container)
  })
})
