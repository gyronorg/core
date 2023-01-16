import { createInstance, createVNode, h, useValue, nextRender } from '../src'

describe('Runtime', () => {
  const container = document.createElement('div')

  beforeEach(() => {
    container.innerHTML = ''
  })

  test('static html', () => {
    const App = createVNode('div', null, 'app')
    createInstance(App).render(container)
    expect(container.innerHTML).toBe('<div>app</div>')
  })

  test('fragment html', () => {
    createInstance(createVNode(['hello ', 'Gyron'])).render(container)
    expect(container.innerHTML).toBe('hello Gyron')
  })

  test('useEffect content', async () => {
    const state = useValue('0')
    const Child = () => {
      return createVNode('div', null, state.value)
    }
    createInstance(h(Child)).render(container)
    const children = container.querySelector('div')
    expect(children.innerHTML).toBe('0')
    state.value = '1'
    await nextRender()
    expect(children.innerHTML).toBe('1')
  })

  test('component', async () => {
    const App = h(() => {
      return createVNode('div', null, [
        createVNode('span', {}, 0),
        createVNode('span', {}, '1'),
      ])
    })
    createInstance(App).render(container)
    const childrenElement = container.querySelectorAll('span')
    expect(childrenElement.length).toBe(2)
  })

  test('fragment should remove', async () => {
    const shouldVisitable = useValue(true)
    const App = h(() => {
      return () =>
        createVNode(
          'div',
          null,
          shouldVisitable.value ? createVNode(['visible']) : ''
        )
    })
    createInstance(App).render(container)
    expect(container.innerHTML).toBe('<div>visible</div>')
    shouldVisitable.value = false
    await nextRender()
    expect(container.innerHTML).toBe('<div></div>')
  })

  test('selector element', () => {
    container.id = 'root'
    document.body.appendChild(container)
    createInstance(createVNode('Gyron')).render('#root')
    expect(container.innerHTML).toBe('Gyron')
    document.body.removeChild(container)

    const fn = jest.fn()
    const warn = console.warn
    console.warn = fn
    const app = createInstance(createVNode('Gyron')).render('#app')
    expect(app).toBe(null)
    expect(fn).toHaveBeenCalled()
    console.warn = warn
  })

  test('rendering the same vnode repeatedly should use an existing DOM node', () => {
    createInstance(
      createVNode('div', null, createVNode('div', null, 'Gyron.js'))
    ).render(container)
    const node = container.querySelector('div')
    createInstance(
      createVNode('div', null, createVNode('div', null, 'Gyron.js'))
    ).render(container)
    expect(node).toBe(container.querySelector('div'))
  })

  test('should warn set html to vnode', () => {
    const fn = jest.fn()
    const warn = console.warn
    console.warn = fn
    createInstance(
      h('div', { html: '<span>Gyron</span>' }, h('span', 'Gyron2'))
    ).render(container)
    expect(container.innerHTML).toBe('<div><span>Gyron2</span></div>')
    expect(fn).toHaveBeenCalled()
    console.warn = warn
  })

  test('basic html to vnode', () => {
    createInstance(h('div', { html: '<span>Gyron</span>' })).render(container)
    expect(container.innerHTML).toBe('<div><span>Gyron</span></div>')
  })

  test('flat children', () => {
    const App = createVNode('div', null, [
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      [h('div', 'hello')],
      h('div', 'gyron!'),
    ])
    createInstance(App).render(container)
    expect(container.innerHTML).toBe(
      '<div><div>hello</div><div>gyron!</div></div>'
    )
  })

  test('patch diff nodeName', async () => {
    let foo = true
    const App = h(() => {
      return foo ? h('div', null, []) : h('input', null, [])
    })
    createInstance(App).render(container)
    expect(container.innerHTML).toBe('<div></div>')
    foo = false
    App.component.update()
    await nextRender()
    expect(container.innerHTML).toBe('<input>')
  })
})
