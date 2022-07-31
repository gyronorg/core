import {
  createInstance,
  createVNode,
  useRef,
  h,
  useValue,
  Primitive,
  nextRender,
  exposeComponent,
} from '../src'

describe('Ref', () => {
  const container = document.createElement('div')

  beforeEach(() => {
    container.innerHTML = ''
  })

  test('set element to ref', () => {
    const ref = useRef()
    const App = createVNode(
      'div',
      {
        ref: ref,
      },
      'app'
    )
    createInstance(App).render(container)
    expect(ref.current).toBe(container.querySelector('div'))
  })

  test('set component to ref', () => {
    const ref = useRef()
    const foo = {
      bar: 'bar',
    }
    const App = h(() => {
      exposeComponent(foo)
      return createVNode('div')
    })
    createInstance(h(App, { ref: ref })).render(container)
    expect(ref.current).toMatchObject(foo)
  })

  test('exposed component any', async () => {
    const Child = () => {
      const foo = useValue('foo')
      exposeComponent({
        foo: foo,
      })
      return () => h('div', null, foo.value)
    }
    const ref = useRef<{
      foo: Primitive<string>
    }>()
    const App = () => {
      return h(Child, { ref })
    }
    createInstance(h(App)).render(container)
    expect(container.innerHTML).toBe('<div>foo</div>')
    ref.current.foo.value = 'baz'

    await nextRender()
    expect(container.innerHTML).toBe('<div>baz</div>')
  })
})
