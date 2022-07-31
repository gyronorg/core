import { createInstance, createVNode, h, useValue, nextRender } from '../src'

describe('Comment', () => {
  test('position', async () => {
    const container = document.createElement('div')
    const App = h(() => {
      const count = useValue(0)
      return () =>
        createVNode(
          'span',
          {
            id: 'btn',
            onClick() {
              count.value++
            },
          },
          [
            createVNode('span', null, 'before'),
            count.value % 2 ? createVNode('span', null, 'comment') : false,
            createVNode('span', null, 'after'),
          ]
        )
    })
    createInstance(App).render(container)
    const btn = container.querySelector('span#btn') as HTMLSpanElement
    expect(btn.innerHTML).toBe('<span>before</span><!----><span>after</span>')
    btn.click()
    await nextRender()
    expect(btn.innerHTML).toBe(
      '<span>before</span><span>comment</span><span>after</span>'
    )
  })
})
