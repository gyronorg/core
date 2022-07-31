import {
  createVNode,
  createText,
  createComment,
  createFragment,
  createComponent,
  useValue,
  createSSRInstance,
  getCurrentComponent,
  VNode,
} from '@gyron/runtime'
import { renderToString } from '../src'

describe('RenderToString', () => {
  test('[RenderToString] text', async () => {
    const html = await renderToString(createText('text'))
    expect(html).toBe('text')
  })

  test('[RenderToString] comment', async () => {
    const html = await renderToString(createComment())
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
        createFragment([createText('hello'), createText('world')])
      )
    )
    expect(html).toBe('<div><!--[-->hello<!--|-->world<!--]--></div>')
  })

  test('[RenderToString] element fragment', async () => {
    const Child = () =>
      createFragment([
        createVNode('p', null, 'foo'),
        createVNode('p', null, 'bar'),
      ])
    const html = await renderToString(createComponent(Child))

    expect(html).toBe('<!--[--><p>foo</p><p>bar</p><!--]-->')
  })

  test('[RenderToString] component', async () => {
    const html = await renderToString(
      createComponent(() => {
        return createVNode('div', null, 'text')
      })
    )
    expect(html).toBe('<div>text</div>')
  })

  test('[RenderToString] useValue value component', async () => {
    const html = await renderToString(
      createComponent(() => {
        const count = useValue(0)
        return () => {
          return createVNode('div', null, count.value)
        }
      })
    )
    expect(html).toBe('<div>0</div>')
  })

  test('[RenderToString] deep component', async () => {
    const Child = createComponent(() => createVNode('div', null, 'child'))
    const html = await renderToString(
      createComponent(() => {
        return createVNode('div', null, Child)
      })
    )
    expect(html).toBe('<div><div>child</div></div>')
  })

  test('[RenderToString] deep root', async () => {
    let foo: VNode
    const Child = createComponent(() => {
      foo = getCurrentComponent().vnode.root
      return createVNode('div', null, 'child')
    })
    const App = createComponent(() => {
      return createVNode('div', null, Child)
    })
    const { root } = createSSRInstance(App)
    await renderToString(root)
    expect(foo === root).toBe(true)
  })
})
