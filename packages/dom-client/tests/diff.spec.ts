import {
  createInstance,
  createVNode,
  useValue,
  h,
  nextRender,
} from '@gyron/runtime'
import { mountProps, patchProp } from '../src/props'

function triggerInput(element: any) {
  const event = document.createEvent('Event')
  event.initEvent('input', true, true)
  element.dispatchEvent(event)
}

describe('diff', () => {
  const container = document.createElement('div')

  beforeEach(() => {
    container.innerHTML = ''
  })

  test('patch prop (event/style/class)', () => {
    let t: string
    const vnode = createVNode('div')
    const fn = jest.fn((type) => (t = type))
    patchProp(
      container,
      'style',
      vnode,
      { width: 1 },
      { width: 1 },
      { update: fn }
    )
    expect(fn).not.toHaveBeenCalled()
    patchProp(
      container,
      'style',
      vnode,
      { width: 1 },
      { width: 2 },
      { update: fn }
    )
    expect(fn).toHaveBeenCalled()
    patchProp(container, 'class', vnode, 'foo', 'bar', { update: fn })
    expect(fn).toHaveBeenCalledTimes(2)
    expect(t).toBe('class')
    patchProp(container, 'class', vnode, 'foo', 'foo', { update: fn })
    expect(fn).toHaveBeenCalledTimes(2)
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const oldEvent = () => {}
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const newEvent = () => {}
    patchProp(container, 'onChange', vnode, oldEvent, newEvent, { update: fn })
    expect(fn).toHaveBeenCalledTimes(3)
    patchProp(container, 'onChange', vnode, newEvent, newEvent, { update: fn })
    expect(fn).toHaveBeenCalledTimes(3)
  })

  test('input change event', async () => {
    const fn = jest.fn()
    const container = document.createElement('input')
    const vnode = createVNode('input', {
      onChange: fn,
    })
    mountProps(container, vnode)
    triggerInput(container)
    expect(fn).toHaveBeenCalled()
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
