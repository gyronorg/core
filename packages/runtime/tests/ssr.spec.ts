import { noop, sleep } from '@gyron/shared'
import {
  createSSRInstance,
  createText,
  h,
  nextRender,
  useValue,
  createComment,
  createComponent,
  createVNode,
  createElement,
  createFragment,
  VNode,
  FCA,
  useRef,
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
      h(() => createText(text.value))
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
      h(() => createText('foo'))
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
      h(() => createText('bar'))
    )
    expect(container.innerHTML).toBe('bar')
    expect(fn).toHaveBeenCalled()
  })

  test('comment', () => {
    const { container } = ssr('<!---->', createComment())
    expect(container.innerHTML).toBe('<!---->')
  })

  test('mismatch comment', () => {
    const fn = jest.fn((message) => {
      expect(message).toContain('[hydrate] server render mismatch')
    })
    console.warn = fn
    const { container } = ssr('foo', createComment())
    expect(container.innerHTML).toBe('<!---->')
    expect(fn).toHaveBeenCalled()
  })

  test('element', async () => {
    const count = useValue(0)
    const { container } = ssr(
      '<div>0</div>',
      h(() =>
        createElement(
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
    const divRef = useRef()
    ssr('<div>0</div>', createElement('div', { ref: divRef }, 0))
    expect(divRef.current.innerHTML).toBe('0')
  })

  test('component', async () => {
    const text = useValue('foo')
    const Child = createComponent(() => createText(text.value))
    const Parent = createComponent(() => Child)
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
      createComponent(() =>
        createFragment(
          list.value.map((item) => createElement('span', null, item))
        )
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
      createComponent(() => createFragment([createElement('span', null, 0)]))
    )
    expect(container.innerHTML).toBe('<span>0</span>')
    expect(fn).toHaveBeenCalled()
  })

  test('children expression', async () => {
    const { container } = ssr(
      '<div><!--[-->b<!--|-->2022<!--|-->a<!--]--></div>',
      createComponent(() =>
        createVNode(
          'div',
          null,
          createFragment(['b', new Date().getFullYear(), 'a'])
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
      createComponent(() =>
        createVNode('div', null, [
          createComponent(() => {
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
})
