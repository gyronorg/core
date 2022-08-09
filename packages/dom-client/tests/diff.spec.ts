import { createInstance, createVNode, useValue, h, nextRender } from 'gyron'

describe('Diff', () => {
  const container = document.createElement('div')

  beforeEach(() => {
    container.innerHTML = ''
  })

  test('text', async () => {
    const count = useValue(0)
    const app = () => createVNode('span', null, count.value)
    createInstance(h(app)).render(container)
    const child = container.querySelector('span')
    count.value = 1
    await nextRender()
    expect(child.innerHTML).toBe('1')
  })

  test('list', async () => {
    const count = useValue([])
    const app = () =>
      createVNode(
        'span',
        null,
        count.value.map((x) => x)
      )
    createInstance(h(app)).render(container)
    const child = container.querySelector('span')
    count.value.push(count.value.length)
    await nextRender()
    expect(child.innerHTML).toBe('0')
    count.value.push(count.value.length)
    await nextRender()
    expect(child.innerHTML).toBe('01')
  })

  test('component list', async () => {
    const count = useValue([])
    const app = () =>
      createVNode(
        'span',
        null,
        count.value.map((x) => createVNode('b', null, x))
      )
    createInstance(h(app)).render(container)
    const child = container.querySelector('span')
    count.value.push(count.value.length)
    await nextRender()
    expect(child.innerHTML).toBe('<b>0</b>')
    count.value.push(count.value.length)
    await nextRender()
    expect(child.innerHTML).toBe('<b>0</b><b>1</b>')
  })

  test('splice list', async () => {
    const container = document.createElement('main')
    const list = useValue([1, 2, 3])
    const App = () => {
      return createVNode(
        'div',
        null,
        list.value.map((x, index) =>
          createVNode(
            'li',
            {
              onClick() {
                list.value.splice(index, 1)
              },
            },
            x
          )
        )
      )
    }

    createInstance(h(App)).render(container)
    expect(container.querySelectorAll('li').length).toBe(3)
    container.querySelectorAll('li')[1].click()
    await nextRender()
    expect(list.value).toEqual([1, 3])
    expect(container.querySelectorAll('li').length).toBe(2)
    expect(container.innerHTML).toBe('<div><li>1</li><li>3</li></div>')
    container.querySelectorAll('li')[0].click()
    await nextRender()
    expect(container.innerHTML).toBe('<div><li>3</li></div>')
    list.value.push(4)
    await nextRender()
    expect(container.innerHTML).toBe('<div><li>3</li><li>4</li></div>')
    container.querySelectorAll('li')[0].click()
    await nextRender()
    expect(container.innerHTML).toBe('<div><li>4</li></div>')
  })

  test('on events', async () => {
    const container = document.createElement('main')
    const count = useValue(0)
    const e = jest.fn(() => (count.value = 1))
    const f = jest.fn(() => (count.value = 0))
    const App = () => {
      return () =>
        createVNode(
          'div',
          {
            onClick: count.value === 0 ? e : f,
          },
          count.value
        )
    }
    createInstance(h(App)).render(container)
    const app = container.querySelector('div')
    app.click()
    await nextRender()
    expect(e.mock.calls.length).toBe(1)
    expect(f.mock.calls.length).toBe(0)
    expect(app.innerHTML).toBe('1')
    app.click()
    await nextRender()
    expect(e.mock.calls.length).toBe(1)
    expect(f.mock.calls.length).toBe(1)
    expect(app.innerHTML).toBe('0')
    app.click()
    await nextRender()
    expect(e.mock.calls.length).toBe(2)
    expect(f.mock.calls.length).toBe(1)
    expect(app.innerHTML).toBe('1')
  })

  test('class name', async () => {
    const container = document.createElement('div')
    const App = () => {
      const className = useValue('c1')
      return () =>
        createVNode('span', {
          class: className.value,
          onClick() {
            className.value = className.value === 'c1' ? 'c2' : 'c1'
          },
        })
    }
    createInstance(h(App)).render(container)
    const app = container.querySelector('span')
    expect(app.className).toBe('c1')
    app.click()
    await nextRender()
    expect(app.className).toBe('c2')
  })
})
