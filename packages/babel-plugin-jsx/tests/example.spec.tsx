import { createInstance, Element, nextRender, useValue } from '@gyron/runtime'
import { noop } from '@gyron/shared'

describe('Demo', () => {
  test('example basic', () => {
    const app = <span>test</span>
    expect(typeof app.flag).toBe('symbol')
  })

  test('example jsx and reactivity content', async () => {
    const container = document.createElement('div')
    const content = useValue(0)
    const App = () => <span>{content.value}</span>
    createInstance(<App />).render(container)
    const children = container.querySelector('span')
    expect(children.innerHTML).toBe('0')
    content.value = 1
    await nextRender()
    expect(children.innerHTML).toBe('1')
  })

  test('example jsx event', async () => {
    const container = document.createElement('div')
    const content = useValue(0)
    const App = () => (
      <span
        onClick={() => {
          content.value = 1
        }}
      >
        {content.value}
      </span>
    )
    createInstance(<App />).render(container)
    const children = container.querySelector('span')
    expect(children.innerHTML).toBe('0')
    children.click()
    await nextRender()
    expect(children.innerHTML).toBe('1')
  })

  test('example jsx events', () => {
    const app = <span onClick={noop} onDblclick={noop}></span>
    expect(app.tag).toBe('span')
    expect(app.props.onClick).toBe(noop)
    expect(app.props.onDblclick).toBe(noop)
  })

  test('example array map render', () => {
    const app = (
      <span>
        {[1, 2, 3].map((x) => (
          <span>{x}</span>
        ))}
      </span>
    )
    expect(app.children[0].type).toBe(Element)
    expect(app.children[1].type).toBe(Element)
    expect(app.children[2].type).toBe(Element)
  })

  test('example jsx array effect', async () => {
    const list = useValue([])
    const App = () => (
      <ul>
        {list.value.map((x) => (
          <li>{x}</li>
        ))}
      </ul>
    )
    const container = document.createElement('div')
    createInstance(<App />).render(container)
    let children = container.querySelectorAll('li')
    expect(children.length).toBe(0)
    list.value.push('text')
    await nextRender()
    children = container.querySelectorAll('li')
    expect(children.length).toBe(1)
    expect(children[0].textContent).toBe('text')
  })

  test('example jsx map context on event', async () => {
    const list = useValue([1, 2, 3])
    const App = () => (
      <ul>
        {list.value.map((x, index) => (
          <li
            onClick={() => {
              list.value.splice(index, 1)
            }}
          >
            {x}
          </li>
        ))}
      </ul>
    )
    const container = document.createElement('div')
    createInstance(<App />).render(container)
    let children = container.querySelectorAll('li')
    expect(children.length).toBe(3)

    children[1].click()
    await nextRender()
    children = container.querySelectorAll('li')
    expect(children.length).toBe(2)
    const childrenContainer = container.querySelector('ul')
    expect(childrenContainer.innerHTML.replace(/\s+/g, '')).toBe(
      '<li>1</li><li>3</li>'
    )
  })

  test('example jsx children deep', async () => {
    const child = (x) => <li>{x}</li>
    const list = useValue([])
    const App = () => {
      return (
        <ul
          onClick={() => {
            list.value.push(Math.random().toFixed(2))
          }}
        >
          {list.value.map((x) => child(x))}
        </ul>
      )
    }
    const container = document.createElement('div')
    createInstance(<App />).render(container)
    const box = container.querySelector('ul')
    box.click()
    await nextRender()
    expect(container.querySelectorAll('li').length).toBe(1)
    box.click()
    await nextRender()
    expect(container.querySelectorAll('li').length).toBe(2)
  })

  test('example fragment node', () => {
    const App = () => (
      <>
        <span>0</span>
        <span>1</span>
      </>
    )
    const container = document.createElement('div')
    createInstance(<App />).render(container)
    expect(container.innerHTML).toBe('<span>0</span><span>1</span>')
  })

  test('Example JSXSpreadAttribute', () => {
    const App = () => <span {...{ a: 1, 'a-b': 1 }} />
    const container = document.createElement('div')
    createInstance(<App />).render(container)
    expect(container.innerHTML).toBe('<span a="1" a-b="1"></span>')
  })
})
