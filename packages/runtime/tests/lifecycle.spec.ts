import {
  createInstance,
  createVNode,
  h,
  FC,
  onAfterMount,
  onBeforeUpdate,
  useValue,
  nextRender,
  onDestroyed,
  onAfterUpdate,
  onBeforeMount,
} from '../src'

describe('Lifecycle', () => {
  const container = document.createElement('div')

  beforeEach(() => {
    container.innerHTML = ''
  })

  test('not mounted', () => {
    const f = jest.fn()
    const Child = FC(() => {
      onAfterMount(() => {
        f()
      })
      return () => createVNode('span', null, 'test')
    })
    createInstance(h(Child))
    expect(f.mock.calls.length).toBe(0)
  })

  test('component mounted', () => {
    const f = jest.fn()
    const Child = FC(() => {
      onAfterMount(() => {
        f()
      })
      return () => createVNode('span', null, 'test')
    })
    createInstance(h(Child)).render(document.createElement('div'))
    expect(f.mock.calls.length).toBe(1)
  })

  test('multiple mounted', () => {
    const f = jest.fn()
    const Child = FC(() => {
      onAfterMount(() => {
        f()
      })
      onAfterMount(() => {
        f()
      })
      return () => createVNode('span', null, 'test')
    })
    createInstance(h(Child)).render(document.createElement('div'))
    expect(f.mock.calls.length).toBe(2)
  })

  test('multiple component mounted', () => {
    const f = jest.fn()
    const e = jest.fn()
    const A = FC(() => {
      onAfterMount(() => {
        f()
      })
      return () => createVNode('span', null, 'test')
    })
    const B = FC(() => {
      onAfterMount(() => {
        e()
      })
      return () => createVNode('span', null, 'test')
    })
    createInstance(h(() => createVNode('div', null, [h(A), h(B)]))).render(
      document.createElement('div')
    )
    expect(f.mock.calls.length).toBe(1)
    expect(e.mock.calls.length).toBe(1)
  })

  test('beforeUpdate', async () => {
    const Child = FC<{ a: number }>(() => {
      onBeforeUpdate(() => {
        return false
      })
      return ({ children }) => createVNode('span', null, children)
    })
    createInstance(
      h(() => {
        const v = useValue(0)
        return () =>
          createVNode(
            'div',
            {
              onClick() {
                v.value++
              },
              id: 'app',
            },
            h(Child, { a: 1 }, v.value)
          )
      })
    ).render(container)
    const app = container.querySelector('#app') as HTMLDivElement
    expect(app.innerHTML).toBe('<span>0</span>')
    app.click()
    await nextRender()
    expect(app.innerHTML).toBe('<span>0</span>')
  })

  test('component unmounted', async () => {
    const f = jest.fn()
    const Son = FC(() => {
      onDestroyed(f)
      return () => createVNode('span', null, 'test')
    })
    const Child = FC(() => {
      onDestroyed(f)
      return () => h(Son)
    })
    createInstance(
      h(
        FC(() => {
          const v = useValue(true)
          return () => {
            return createVNode(
              'span',
              {
                onClick() {
                  v.value = !v.value
                },
                id: 'target',
              },
              v.value ? h(Child) : ''
            )
          }
        })
      )
    ).render(container)
    expect(f.mock.calls.length).toBe(0)
    const target = container.querySelector('#target') as HTMLSpanElement
    target.click()
    await nextRender()
    expect(f.mock.calls.length).toBe(2)
  })

  test('updated', async () => {
    const f = jest.fn()
    const Child = FC(() => {
      const v = useValue(0)
      onAfterUpdate(f)
      return () =>
        createVNode(
          'span',
          {
            id: 'app',
            onClick() {
              v.value++
            },
          },
          v.value
        )
    })
    createInstance(h(Child)).render(container)
    const app = container.querySelector('#app') as HTMLSpanElement
    expect(f.mock.calls.length).toBe(0)
    app.click()
    await nextRender()
    expect(f.mock.calls.length).toBe(1)
    app.click()
    await nextRender()
    expect(f.mock.calls.length).toBe(2)
  })

  test('on before mount change react value', async () => {
    createInstance(
      h(() => {
        const count = useValue(0)
        onBeforeMount(() => {
          ++count.value
        })
        onAfterMount(() => {
          ++count.value
        })
        return () => h('div', null, count.value)
      })
    ).render(container)
    expect(container.innerHTML).toBe('<div>1</div>')
    await nextRender()
    expect(container.innerHTML).toBe('<div>2</div>')
  })
})
