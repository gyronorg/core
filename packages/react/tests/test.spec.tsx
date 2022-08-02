import { createInstance, FC } from '@gyron/runtime'
import { createContext } from '../src'

describe('base', () => {
  const container = document.createElement('div')

  beforeEach(() => {
    container.innerHTML = ''
  })

  test('context', () => {
    const Context = createContext(0)
    const Son = FC(() => {
      return (
        <Context.Consumer>{(value) => <div>{value}</div>}</Context.Consumer>
      )
    })
    const Child = FC(() => {
      return <Son />
    })
    const App = FC(() => {
      return (
        <Context.Provider value={1}>
          <Child />
        </Context.Provider>
      )
    })
    createInstance(<App />).render(container)
    expect(container.innerHTML).toBe('<div>1</div>')
  })
})
