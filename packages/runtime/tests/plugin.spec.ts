import { createInstance, h, getPlugins } from '../src'
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
    const plugin = {
      extra: state,
      data: state,
    }
    const plugins = getPlugins()
    plugins.set('state', state)
    expect(plugin.extra).toBe(state)
    createInstance(
      h(() => {
        const context = getPlugins()
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
})
