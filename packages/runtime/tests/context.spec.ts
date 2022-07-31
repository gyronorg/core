import {
  createVNode,
  createInstance,
  VNode,
  getCurrentComponent,
  h,
  nextRender,
  Primitive,
  useValue,
  useInject,
  useProvide,
} from '../src'

describe('Context', () => {
  const container = document.createElement('div')

  beforeEach(() => {
    container.innerHTML = ''
  })

  test('root', () => {
    let childVNode: VNode
    const Child = h(() => {
      const component = getCurrentComponent()
      childVNode = component.vnode
      return createVNode('span')
    })
    const App = h(() => {
      return () => h(Child)
    })
    createInstance(App).render(container)
    expect(childVNode.root === App).toBe(true)
  })

  test('component', async () => {
    const foo = Symbol('')
    const Child = ({ click }: { click: (e: MouseEvent) => any }) => {
      const inject = useInject()
      const data = inject<Primitive<number>>(foo)
      return createVNode(
        'span',
        {
          onClick: click,
        },
        data.value
      )
    }
    const App = h(() => {
      const provide = useProvide()
      const data = useValue(1)
      provide(foo, data)
      return () =>
        h(Child, {
          click: () => {
            data.value++
          },
        })
    })
    createInstance(App).render(container)
    expect(container.innerHTML).toBe('<span>1</span>')
    container.querySelector('span').click()
    await nextRender()
    expect(container.innerHTML).toBe('<span>2</span>')
  })
})
