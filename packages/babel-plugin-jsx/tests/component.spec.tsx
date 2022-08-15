import { createInstance, FC, FCA, nextRender, useValue } from 'gyron'
import { trim } from './util'

describe('Component TSX', () => {
  test('define', () => {
    const container = document.createElement('div')
    const App = FC<{ count: number }>((props) => {
      return <span>{props.count}</span>
    })
    createInstance(<App count={0} />).render(container)
    expect(trim(container.innerHTML)).toBe('<span>0</span>')
    const FApp = FCA<{ count: number }>(async (props) => {
      return <span>{props.count}</span>
    })
    createInstance(<FApp count={0} />).render(container)
  })

  test('define children', () => {
    const container = document.createElement('div')
    const App = FC<{ count: number }>(() => {
      return (props) => <span>{props.count}</span>
    })
    createInstance(<App count={0} />).render(container)
    expect(trim(container.innerHTML)).toBe('<span>0</span>')
  })

  test('props child', () => {
    const container = document.createElement('div')
    const Child = (props: { count: number }) => {
      return <span>{props.count}</span>
    }
    const App = FC(() => {
      return ({ children }) => <div>{children}</div>
    })
    createInstance(
      <App>
        <Child count={0} />
      </App>
    ).render(container)
    expect(trim(container.innerHTML)).toBe('<div><span>0</span></div>')
  })

  test('render child', async () => {
    const container = document.createElement('div')
    const Child = FC(() => {
      const count = useValue(0)
      return () => <span onClick={() => count.value++}>{count.value}</span>
    })
    createInstance(<Child />).render(container)
    const child = container.querySelector('span')
    expect(child.innerHTML).toBe('0')
    child.click()
    await nextRender()
    expect(child.innerHTML).toBe('1')
  })

  test('child A and B', async () => {
    const container = document.createElement('div')
    const A = FC<{ w: number }>(() => {
      const v = useValue(0)
      return (props) => (
        <div
          onClick={() => {
            v.value++
          }}
          id="a"
        >
          {v.value} - {props.w}
        </div>
      )
    })
    const B = FC<{ w: number }>(() => {
      const v = useValue(0)
      return (props) => (
        <div
          onClick={() => {
            v.value++
          }}
          id="b"
        >
          {props.w} - {v.value}
        </div>
      )
    })
    const w = useValue(0)
    const App = () => {
      return (
        <div>
          <A w={w.value} />
          <B w={w.value} />
        </div>
      )
    }
    createInstance(<App />).render(container)
    const a = container.querySelector('#a') as HTMLDivElement
    const b = container.querySelector('#b') as HTMLDivElement
    expect(trim(container.innerHTML)).toBe(
      '<div><divid="a">0-0</div><divid="b">0-0</div></div>'
    )
    a.click()
    await nextRender()
    expect(trim(a.innerHTML)).toBe('1-0')
    b.click()
    await nextRender()
    expect(trim(b.innerHTML)).toBe('0-1')
    w.value++
    await nextRender()
    expect(trim(a.innerHTML)).toBe('1-1')
    expect(trim(b.innerHTML)).toBe('1-1')
  })
})
