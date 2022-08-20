import { Noop, sleep } from '@gyron/shared'
import {
  createInstance,
  createVNode,
  h,
  useValue,
  nextRender,
  FC,
  useReactive,
  FCA,
  useComputed,
  defineProps,
  onDestroyed,
  Children,
  createRef,
  onBeforeUpdate,
  getCurrentComponent,
  forceUpdate,
  registerWarnHandler,
  onAfterUpdate,
  isVNodeComponent,
  registerErrorHandler,
  useWatch,
  keepComponent,
} from '../src'
import { effectTracks } from '@gyron/reactivity'
import { Gyron } from '../src/vnode'

describe('Component', () => {
  const container = document.createElement('div')

  beforeEach(() => {
    container.innerHTML = ''
  })

  test('define', () => {
    const App = FC<{
      count: number
    }>((props) => {
      return createVNode('span', null, props.count)
    })
    const app = App({ count: 0 }, null)
    expect(app.flag).toBe(Gyron)
  })

  test('useReactive props', async () => {
    const Child = FC<{ count: number }>(() => {
      const props = defineProps<{ count: number }>()
      return () => h('div', null, props.count)
    })
    const count = useValue(0)
    const App = () => {
      return h(Child, { count: count.value })
    }
    createInstance(h(App)).render(container)
    expect(container.innerHTML).toBe('<div>0</div>')
    count.value = 1
    await nextRender()
    expect(container.innerHTML).toBe('<div>1</div>')
  })

  test('not available in the callback', async () => {
    const fn = jest.fn()
    const warn = console.warn
    console.warn = fn
    const App = () => {
      sleep(0).then(() => {
        getCurrentComponent()
      })
      return h('div')
    }
    createInstance(h(App)).render(container)
    await sleep(0)
    expect(fn).toHaveBeenCalled()
    console.warn = warn
  })

  test('force update', () => {
    let count = 0
    const App = h(() => {
      return createVNode(count)
    })
    createInstance(App).render(container)
    count = 1
    expect(container.innerHTML).toBe('0')
    forceUpdate(App.component)
    expect(container.innerHTML).toBe('1')
  })

  test('return async vnode', () => {
    const fn = jest.fn(({ component }) => {
      expect(component).toBe(App.component)
    })
    const App = h(() => {
      registerWarnHandler(fn)
      return Promise.resolve(createVNode('foo'))
    })
    createInstance(App).render(container)
    expect(fn).toHaveBeenCalled()
  })

  test('conditional', async () => {
    const App = () => {
      const state = useReactive({
        count: 0,
      })
      return () => {
        return createVNode(
          'div',
          {
            onClick() {
              state.count++
            },
            id: 'app',
          },
          [state.count % 2 ? 1 : 2]
        )
      }
    }
    createInstance(h(App)).render(container)
    expect(container.innerHTML).toBe('<div id="app">2</div>')
    const app = container.querySelector('#app') as HTMLDivElement
    app.click()
    await nextRender()
    expect(container.innerHTML).toBe('<div id="app">1</div>')
  })

  test('component render child', () => {
    const Son = () => {
      return createVNode('span', null, 'son')
    }
    const Child = ({ children }: { children: Children }) => {
      return createVNode('div', null, children)
    }
    createInstance(h(Child, null, [h(Son)])).render(container)
    expect(container.innerHTML).toBe('<div><span>son</span></div>')
  })

  test('component props event', () => {
    const Child = ({
      children,
      onChange,
    }: {
      children?: Children
      onChange: Noop
    }) => {
      return createVNode(
        'div',
        {
          onClick: onChange,
        },
        children || 'child'
      )
    }
    const f = jest.fn()
    createInstance(
      h(Child, {
        onChange: f,
      })
    ).render(container)
    expect(f.mock.calls.length).toBe(0)
    expect(container.innerHTML).toBe('<div>child</div>')
    container.querySelector('div').click()
    expect(f.mock.calls.length).toBe(1)
  })

  test('props props id', () => {
    const app = () =>
      createVNode(
        'span',
        {
          id: 'app',
        },
        '1'
      )
    createInstance(h(app)).render(container)
    const children = container.querySelector('#app')
    expect(children.innerHTML).toBe('1')
  })

  test('props on with component', async () => {
    const number = useValue(0)
    const content = useComputed(() => {
      return 'click me ' + number.value
    })
    const App = () =>
      createVNode(
        'span',
        {
          onClick() {
            number.value++
          },
        },
        content.value
      )
    createInstance(h(App)).render(container)
    const children = container.querySelector('span')
    expect(children.innerHTML).toBe('click me 0')
    children.click()
    await nextRender()
    expect(children.innerHTML).toBe('click me 1')
  })

  test('component child', () => {
    const Child = () => {
      const count = useValue(0)
      return () => createVNode('span', null, count.value)
    }
    createInstance(h(Child)).render(container)
    const child = container.querySelector('span')
    expect(child.innerHTML).toBe('0')
  })

  test('child change useValue value', async () => {
    const Child = () => {
      const count = useValue(0)
      return () =>
        createVNode(
          'span',
          {
            onClick() {
              count.value++
            },
          },
          count.value
        )
    }
    createInstance(h(Child)).render(container)
    const child = container.querySelector('span')
    child.click()
    await nextRender()
    expect(child.innerHTML).toBe('1')
  })

  test('child change keep Parent', async () => {
    const Child = () => {
      const count = useValue(0)
      return () =>
        createVNode(
          'span',
          {
            onClick() {
              count.value++
            },
          },
          count.value
        )
    }
    const Parent = () => {
      return createVNode(
        'div',
        {
          id: 'parent',
        },
        h(Child)
      )
    }
    createInstance(h(Parent)).render(container)
    const parent = container.querySelector('#parent')
    const child = container.querySelector('span')
    child.click()
    await nextRender()
    expect(parent).toBe(container.querySelector('#parent'))
  })

  test('components child', async () => {
    const container = document.createElement('div')
    const A = () => createVNode('span', null, 'a')
    const B = () => createVNode('span', null, 'b')
    const App = () => {
      const state = useReactive({
        count: 0,
      })
      return () => {
        return createVNode(
          'div',
          {
            onClick() {
              state.count++
            },
            id: 'app',
          },
          [state.count % 2 ? h(A) : h(B)]
        )
      }
    }
    createInstance(h(App)).render(container)
    expect(container.innerHTML).toBe('<div id="app"><span>b</span></div>')
    const app = container.querySelector('#app') as HTMLDivElement
    app.click()
    await nextRender()
    expect(container.innerHTML).toBe('<div id="app"><span>a</span></div>')
  })

  test('props', () => {
    const App = (props: { count: number }) => {
      return createVNode('div', null, props.count)
    }
    const node = h(App, { count: 1 })
    expect(node.props.count).toBe(1)
  })

  test('render props', async () => {
    const container = document.createElement('div')
    const Child = () => {
      const count1 = useValue(0)
      return (props: { count: number }) => {
        return createVNode('div', null, [
          createVNode('div', { id: 'child1' }, props.count),
          createVNode(
            'div',
            {
              id: 'child2',
              onClick() {
                count1.value++
              },
            },
            count1.value
          ),
        ])
      }
    }
    const App = () => {
      const state = useReactive({
        count: 0,
      })
      return () =>
        createVNode(
          'div',
          {
            id: 'app',
            onClick() {
              state.count++
            },
          },
          h(Child, { count: state.count })
        )
    }
    createInstance(h(App)).render(container)
    const app = container.querySelector('#app') as HTMLDivElement
    const child1 = container.querySelector('#child1') as HTMLDivElement
    const child2 = container.querySelector('#child2') as HTMLDivElement
    expect(child1.innerHTML).toBe('0')
    expect(child2.innerHTML).toBe('0')
    app.click()
    await nextRender()
    expect(child1.innerHTML).toBe('1')
    expect(child2.innerHTML).toBe('0')
    app.click()
    await nextRender()
    expect(child1.innerHTML).toBe('2')
    child2.click()
    await nextRender()
    expect(child2.innerHTML).toBe('1')
  })

  test('async component', async () => {
    const container = document.createElement('div')
    const state = useReactive({ count: 0 })
    const App = FCA(async () => {
      return () => createVNode('span', null, state.count)
    })
    createInstance(h(App)).render(container)
    expect(container.innerHTML).toBe('<!--AsyncComponentWrapper-->')
    await sleep(0)
    expect(container.innerHTML).toBe('<span>0</span>')
    state.count = 1
    await nextRender()
    expect(container.innerHTML).toBe('<span>1</span>')
  })

  test('async render component', async () => {
    const App = FCA(async () => {
      return createVNode('span', null, 0)
    })
    createInstance(h(App)).render(container)
    await sleep(0)
    expect(container.innerHTML).toBe('<span>0</span>')
  })

  test('async error component', async () => {
    const fn = jest.fn()
    const App = FCA(async () => {
      registerErrorHandler(fn)
      throw new Error('Uncaught exceptions')
    })
    createInstance(h(App)).render(container)
    await sleep(0)
    expect(fn).toHaveBeenCalled()
  })

  test('deep component', async () => {
    const A1 =
      () =>
      ({ children }) =>
        children
    const A2 =
      () =>
      ({ children }) =>
        h(A1, null, children)
    const A3 =
      () =>
      ({ children }) =>
        h(A2, null, children)

    createInstance(
      h(
        FC(() => {
          const v = useValue(0)
          return () =>
            createVNode(
              'span',
              {
                onClick() {
                  v.value++
                },
              },
              h(A3, null, v.value)
            )
        })
      )
    ).render(container)
    const span = container.querySelector('span')
    expect(container.innerHTML).toBe('<span>0</span>')
    span.click()
    await nextRender()
    expect(container.innerHTML).toBe('<span>1</span>')
  })

  test('unmount nested component', async () => {
    const destroyed = jest.fn()
    const Child = () => {
      return h(
        'div',
        null,
        h(() => {
          onDestroyed(destroyed)
          return () => h('div', 'gyron.js')
        })
      )
    }
    const app = createInstance(
      h(() => {
        return h('div', null, h(Child))
      })
    ).render(container)
    app.destroy()
    expect(destroyed.mock.calls.length).toBe(1)
  })

  test('keyed update', async () => {
    const list = useValue([0])
    createInstance(
      h(() => {
        return createVNode(
          list.value.map((item) => h('li', { key: item }, item))
        )
      })
    ).render(container)
    expect(container.innerHTML).toBe('<li>0</li>')
    list.value.push(1)
    await nextRender()
    // 0
    // 0 1
    expect(container.innerHTML).toBe('<li>0</li><li>1</li>')
    list.value.splice(1, 1)
    await nextRender()
    // 0 1
    // 0
    expect(container.innerHTML).toBe('<li>0</li>')
    list.value.unshift(-1)
    await nextRender()
    // 0
    // -1 0
    expect(container.innerHTML).toBe('<li>-1</li><li>0</li>')
  })

  test('parameters need to be passed correctly on the component', () => {
    const divRef = createRef()
    const click = jest.fn()
    const Child = ({ onClick }) => {
      return h('div', { onClick, ref: divRef })
    }
    const App = h(() => {
      return h(Child, { onClick: click })
    })
    createInstance(App).render(container)
    expect(App.component.subTree.props.onClick).toBe(click)
    divRef.current.click()
    expect(click).toHaveBeenCalled()
  })

  test('before props with after props', async () => {
    const count = useValue(0)
    const update = jest.fn((prevProps, props) => {
      expect(props.count).toBe(prevProps.count + 1)
      return props.count > 1
    })
    const Child = () => {
      onBeforeUpdate(update)
      return ({ count }) => h('span', null, count)
    }
    const App = h(() => {
      return () => h(Child, { count: count.value })
    })
    createInstance(App).render(container)
    expect(container.innerHTML).toBe('<span>0</span>')
    count.value = 1
    await nextRender()
    expect(container.innerHTML).toBe('<span>0</span>')
    count.value = 2
    await nextRender()
    expect(container.innerHTML).toBe('<span>2</span>')
  })

  test('clear component update id', async () => {
    // use resolvedPromise
    await nextRender()
    const list = useValue([])
    const fn = jest.fn()
    const App = h(() => {
      onAfterUpdate(fn)
      return h('div', null, list.value.join('-'))
    })
    createInstance(App).render(container)
    // clear update id
    App.component.update.id = null
    list.value.push(0)
    nextRender(() => {
      expect(fn).toHaveBeenCalledTimes(2)
    })
    expect(isVNodeComponent(App)).toBe(true)
  })

  test('keyed component props', async () => {
    const list = useValue([
      { key: 1, props: { active: false }, value: 1 },
      { key: 2, props: {}, value: 2 },
    ])
    const app = createInstance(
      h(() => {
        return createVNode(
          list.value.map((item) =>
            h('li', { key: item.key, ...item.props }, item.value)
          )
        )
      })
    ).render(container)
    list.value = [{ key: 1, props: { active: true }, value: 1 }]
    await nextRender()
    expect(container.innerHTML).toBe('<li active="">1</li>')
    app.destroy()

    const Child = ({ value, key }) => {
      expect(key).toBeUndefined()
      return h('li', null, h('span', null, value === 1 ? 1 : 4))
    }
    createInstance(
      h(() => {
        return list.value.map((item) =>
          h(Child, { key: item.key, value: item.value })
        )
      })
    ).render(container)
    list.value = [{ key: 2, props: {}, value: 8 }]
    await nextRender()
    expect(container.innerHTML).toBe('<li><span>4</span></li>')
  })

  test('use watch and auto destroy', () => {
    const origin = {
      count: 0,
    }
    const observed = useReactive(origin)
    const App = () => {
      useWatch(() => {
        observed.count
      })
      return h('div')
    }
    const app = createInstance(h(App)).render(container)
    const deps = effectTracks.get(origin)
    expect(deps.get('count').size).toBe(1)
    app.destroy()
    expect(deps.get('count').size).toBe(0)
  })

  test('keep component', async () => {
    const update = jest.fn()
    const Memo = keepComponent<{ count: number }>(() => {
      onAfterUpdate(update)
      return ({ count }) => h('div', null, count)
    })
    const count = useValue(0)
    const trigger = useValue(0)
    createInstance(
      h(() => [h(Memo, { count: count.value }), h('div', null, trigger.value)])
    ).render(container)
    expect(container.innerHTML).toBe('<div>0</div><div>0</div>')
    count.value = 1
    await nextRender()
    expect(update).toHaveBeenCalledTimes(1)
    expect(container.innerHTML).toBe('<div>1</div><div>0</div>')
    trigger.value++
    await nextRender()
    expect(update).toHaveBeenCalledTimes(1)
    expect(container.innerHTML).toBe('<div>1</div><div>1</div>')
  })

  test('keep cache component state', async () => {
    const Memo = keepComponent(() => {
      const count = useValue(0)
      return () =>
        h(
          'div',
          {
            id: 'keep',
            onClick() {
              count.value++
            },
          },
          count.value
        )
    })
    const trigger = useValue(true)
    createInstance(
      h(() => {
        return trigger.value ? h(Memo) : 'empty'
      })
    ).render(container)
    const box = container.querySelector('#keep') as HTMLElement
    box.click()
    await nextRender()
    expect(container.innerHTML).toBe('<div id="keep">1</div>')
    trigger.value = false
    await nextRender()
    expect(container.innerHTML).toBe('empty')
    trigger.value = true
    await nextRender()
    expect(container.innerHTML).toBe('<div id="keep">1</div>')
    box.click()
    await nextRender()
    expect(container.innerHTML).toBe('<div id="keep">2</div>')
  })
})
