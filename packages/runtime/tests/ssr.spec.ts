import { renderToString } from '@gyron/dom-server'
import { noop, sleep } from '@gyron/shared'
import {
  createSSRInstance,
  createVNode,
  h,
  nextRender,
  useValue,
  createVNodeComment,
  VNode,
  FCA,
  createRef,
  onBeforeMount,
  createSSRContext,
} from '../src'

function ssr(html: string, vnode: VNode) {
  const container = document.createElement('div')
  container.innerHTML = html
  createSSRInstance(vnode).render(container)
  return {
    container,
  }
}

describe('SSR', () => {
  const warn = console.warn

  beforeEach(() => {
    document.body.innerHTML = ''
  })

  afterEach(() => {
    console.warn = warn
  })

  test('text', async () => {
    const text = useValue('foo')
    const { container } = ssr(
      'foo',
      h(() => createVNode(text.value))
    )
    expect(container.innerHTML).toBe('foo')
    text.value = 'bar'
    await nextRender()
    expect(container.innerHTML).toBe('bar')
  })

  test('mismatch text', () => {
    const fn = jest.fn((message) => {
      expect(message).toContain('[hydrate] server render mismatch')
    })
    console.warn = fn
    const { container } = ssr(
      '<span>foo</span>',
      h(() => createVNode('foo'))
    )
    expect(container.innerHTML).toBe('foo')
    expect(fn).toHaveBeenCalled()
  })

  test('mismatch text content', () => {
    const fn = jest.fn((message) => {
      expect(message).toContain('[hydrate] text data mismatch')
    })
    console.warn = fn
    const { container } = ssr(
      'foo',
      h(() => createVNode('bar'))
    )
    expect(container.innerHTML).toBe('bar')
    expect(fn).toHaveBeenCalled()
  })

  test('comment', () => {
    const { container } = ssr('<!---->', createVNodeComment())
    expect(container.innerHTML).toBe('<!---->')
  })

  test('mismatch comment', () => {
    const fn = jest.fn((message) => {
      expect(message).toContain('[hydrate] server render mismatch')
    })
    console.warn = fn
    const { container } = ssr('foo', createVNodeComment())
    expect(container.innerHTML).toBe('<!---->')
    expect(fn).toHaveBeenCalled()
  })

  test('element', async () => {
    const count = useValue(0)
    const { container } = ssr(
      '<div>0</div>',
      h(() =>
        createVNode(
          'div',
          {
            onClick() {
              count.value++
            },
          },
          count.value
        )
      )
    )
    expect(container.innerHTML).toBe('<div>0</div>')
    count.value = 1
    await nextRender()
    expect(container.innerHTML).toBe('<div>1</div>')
    container.querySelector('div').click()
    await nextRender()
    expect(container.innerHTML).toBe('<div>2</div>')
  })

  test('element ref', () => {
    const divRef = createRef()
    ssr('<div>0</div>', createVNode('div', { ref: divRef }, 0))
    expect(divRef.current.innerHTML).toBe('0')
  })

  test('component', async () => {
    const text = useValue('foo')
    const Child = createVNode(() => createVNode(text.value))
    const Parent = createVNode(() => Child)
    const { container } = ssr('foo', Parent)
    expect(container.innerHTML).toBe('foo')
    text.value = 'bar'
    await nextRender()
    expect(container.innerHTML).toBe('bar')
  })

  test('fragment', async () => {
    const list = useValue([0])
    const { container } = ssr(
      '<!--[--><span>0</span><!--]-->',
      createVNode(() =>
        createVNode(list.value.map((item) => createVNode('span', null, item)))
      )
    )

    expect(container.innerHTML).toBe('<!--[--><span>0</span><!--]-->')
    list.value.push(list.value.length)
    await nextRender()
    expect(container.innerHTML).toBe(
      '<!--[--><span>0</span><span>1</span><!--]-->'
    )
  })

  test('mismatch fragment start flag', () => {
    const fn = jest.fn((message) => {
      expect(message).toContain('[hydrate] server render mismatch')
    })
    console.warn = fn
    const { container } = ssr(
      '<span>0</span>',
      createVNode(() => createVNode([createVNode('span', null, 0)]))
    )
    expect(container.innerHTML).toBe('<span>0</span>')
    expect(fn).toHaveBeenCalled()
  })

  test('children expression', async () => {
    const { container } = ssr(
      '<div><!--[-->b<!--|-->2022<!--|-->a<!--]--></div>',
      createVNode(() =>
        createVNode(
          'div',
          null,
          createVNode(['b', new Date().getFullYear(), 'a'])
        )
      )
    )

    expect(container.innerHTML).toBe(
      '<div><!--[-->b<!--|-->2022<!--|-->a<!--]--></div>'
    )
  })

  test('elements children', async () => {
    const count = useValue(0)
    const { container } = ssr(
      '<div><b><p>0</p><ul><li>0</li></ul></b></div>',
      createVNode(() =>
        createVNode('div', null, [
          createVNode(() => {
            return () =>
              createVNode('b', null, [
                createVNode('p', null, count.value),
                createVNode('ul', null, createVNode('li', null, 0)),
              ])
          }),
        ])
      )
    )
    expect(container.innerHTML).toBe(
      '<div><b><p>0</p><ul><li>0</li></ul></b></div>'
    )
    count.value = 1
    await nextRender()
    expect(container.innerHTML).toBe(
      '<div><b><p>1</p><ul><li>0</li></ul></b></div>'
    )
  })

  test('mismatch', () => {
    console.warn = noop
    const { container } = ssr(
      '<div><!--[--><p>hello world</p><!--]--></div>',
      createVNode('div', null, [createVNode('p', null, 'hello world')])
    )
    expect(container.innerHTML).toBe('<div><p>hello world</p></div>')
  })

  test('fca async component bind el', async () => {
    const { container } = ssr(
      '<div>0</div>',
      h(
        FCA(async () => {
          await sleep(0)
          const count = useValue(0)
          return () =>
            h(
              'div',
              {
                onClick() {
                  count.value++
                },
              },
              count.value
            )
        })
      )
    )
    await sleep(0)
    expect(container.innerHTML).toBe('<div>0</div>')
    container.querySelector('div').click()
    await nextRender()
    expect(container.innerHTML).toBe('<div>1</div>')
  })

  test('async component lifecycle', async () => {
    const container = document.createElement('div')
    const fn = jest.fn()
    const App = FCA(async () => {
      onBeforeMount(fn)
      return createVNode('span', null, 0)
    })
    container.innerHTML = '<span>0</span>'
    createSSRInstance(h(App)).render(container)
    await sleep(0)
    expect(fn).toHaveBeenCalled()
  })

  test('ssr context message in client', async () => {
    const uri = 'demo/view/foo.tsx?name=App'
    const container = document.createElement('div')
    container.innerHTML = '<span>Hello Gyron</span>'

    const App = h(({ msg }) => {
      return h('span', null, msg)
    })
    App.__uri = uri

    const root = createSSRContext({
      message: {
        [uri]: {
          msg: 'Hello Gyron',
        },
      },
    }).render(App, container)

    const html = await renderToString(root)
    expect(html).toBe('<span>Hello Gyron</span>')
  })
})
