import { createVNode, createVNodeComment, useValue } from '@gyron/runtime'
import { renderToString } from '../src'

describe('RenderToString', () => {
  test('text', async () => {
    const html = await renderToString(createVNode('text'))
    expect(html).toBe('text')
  })

  test('comment', async () => {
    const html = await renderToString(createVNodeComment())
    expect(html).toBe('<!---->')
  })

  test('element', async () => {
    const html = await renderToString(createVNode('div', null, 'text'))
    expect(html).toBe('<div>text</div>')
  })

  test('multiple text fragment', async () => {
    const html = await renderToString(
      createVNode(
        'div',
        null,
        createVNode([createVNode('hello'), createVNode('world')])
      )
    )
    expect(html).toBe('<div><!--[-->hello<!--|-->world<!--]--></div>')
  })

  test('element fragment', async () => {
    const Child = () =>
      createVNode([
        createVNode('p', null, 'foo'),
        createVNode('p', null, 'bar'),
      ])
    const html = await renderToString(createVNode(Child))

    expect(html).toBe('<!--[--><p>foo</p><p>bar</p><!--]-->')
  })

  test('component', async () => {
    const html = await renderToString(
      createVNode(() => {
        return createVNode('div', null, 'text')
      })
    )
    expect(html).toBe('<div>text</div>')
  })

  test('useValue value component', async () => {
    const html = await renderToString(
      createVNode(() => {
        const count = useValue(0)
        return () => {
          return createVNode('div', null, count.value)
        }
      })
    )
    expect(html).toBe('<div>0</div>')
  })

  test('deep component', async () => {
    const Child = createVNode(() => createVNode('div', null, 'child'))
    const html = await renderToString(
      createVNode(() => {
        return createVNode('div', null, Child)
      })
    )
    expect(html).toBe('<div><div>child</div></div>')
  })

  test('self close tag render', async () => {
    const html = await renderToString(createVNode('img', { alt: 'logo' }))
    expect(html).toBe('<img alt="logo" />')
  })

  test('static attribute', async () => {
    const html = await renderToString(createVNode('div', { static: true }))
    expect(html).toBe('<div></div>')
  })
})
