import {
  createInstance,
  createVNode,
  h,
  useValue,
  nextRender,
  createFragment,
  createText,
} from '../src'

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
    createInstance(createFragment(['hello ', 'Gyron'])).render(container)
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
    createInstance(createText('Gyron')).render('#root')
    expect(container.innerHTML).toBe('Gyron')
    document.body.removeChild(container)

    const app = createInstance(createText('Gyron')).render('#app')
    expect(app).toBe(null)
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
})
