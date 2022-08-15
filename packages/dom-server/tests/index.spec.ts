import { createVNode, createVNodeComment, useValue } from '@gyron/runtime'
import { renderToString } from '../src'

describe('RenderToString', () => {
  test('[RenderToString] text', async () => {
    const html = await renderToString(createVNode('text'))
    expect(html).toBe('text')
  })

  test('[RenderToString] comment', async () => {
    const html = await renderToString(createVNodeComment())
    expect(html).toBe('<!---->')
  })

  test('[RenderToString] element', async () => {
    const html = await renderToString(createVNode('div', null, 'text'))
    expect(html).toBe('<div>text</div>')
  })

  test('[RenderToString] multiple text fragment', async () => {
    const html = await renderToString(
      createVNode(
        'div',
        null,
        createVNode([createVNode('hello'), createVNode('world')])
      )
    )
    expect(html).toBe('<div><!--[-->hello<!--|-->world<!--]--></div>')
  })

  test('[RenderToString] element fragment', async () => {
    const Child = () =>
      createVNode([
        createVNode('p', null, 'foo'),
        createVNode('p', null, 'bar'),
      ])
    const html = await renderToString(createVNode(Child))

    expect(html).toBe('<!--[--><p>foo</p><p>bar</p><!--]-->')
  })

  test('[RenderToString] component', async () => {
    const html = await renderToString(
      createVNode(() => {
        return createVNode('div', null, 'text')
      })
    )
    expect(html).toBe('<div>text</div>')
  })

  test('[RenderToString] useValue value component', async () => {
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

  test('[RenderToString] deep component', async () => {
    const Child = createVNode(() => createVNode('div', null, 'child'))
    const html = await renderToString(
      createVNode(() => {
        return createVNode('div', null, Child)
      })
    )
    expect(html).toBe('<div><div>child</div></div>')
  })
})
