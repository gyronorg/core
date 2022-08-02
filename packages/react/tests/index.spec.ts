import { createInstance, h, nextRender, VNode } from '@gyron/runtime'
import { useState, useEffect, createContext } from '../src'

describe('base', () => {
  const container = document.createElement('div')

  beforeEach(() => {
    container.innerHTML = ''
  })

  test('use state', () => {
    const [state, setState] = useState(0)
    expect(state.value).toBe(0)
    setState(1)
    expect(state.value).toBe(1)
  })

  test('use effect', async () => {
    const destroyed = jest.fn()
    const effect = jest.fn(() => destroyed)
    const [count, setCount] = useState(0)
    const app = createInstance(
      h(() => {
        useEffect(effect)
        return () => h('div', null, count.value)
      })
    ).render(container)
    expect(effect).toHaveBeenCalledTimes(1)
    setCount(1)
    await nextRender()
    expect(effect).toHaveBeenCalledTimes(2)
    app.destroy()
    expect(destroyed).toHaveBeenCalledTimes(1)
  })

  test('create context', () => {
    const Context = createContext(0)
    createInstance(
      h(() => {
        return h(
          Context.Provider as unknown as VNode,
          { value: 1 },
          h(() => {
            return h(
              Context.Consumer as unknown as VNode,
              null,
              h((value) => {
                return h('div', null, value)
              })
            )
          })
        )
      })
    ).render(container)
    expect(container.innerHTML).toBe('<div>1</div>')
  })
})
