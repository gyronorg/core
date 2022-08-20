import { createInstance, createVNode, h, useValue } from '@gyron/runtime'

test('VNode root', () => {
  const container = document.createElement('div')
  const n = useValue(0)
  const Child = () => [createVNode('span', null, n.value)]
  const App = h(Child)
  createInstance(App).render(container)
  expect(container.innerHTML).toBe('<span>0</span>')
})
