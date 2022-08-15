import { createVNode, createInstance, h, rerender } from '../src'

describe('hmr', () => {
  const container = document.createElement('div')

  beforeEach(() => {
    container.innerHTML = ''
  })

  test('rerender', () => {
    const App = () => {
      return h('div', null, 'hello world')
    }
    App.__hmr_id = 'abc'
    createInstance(h(App)).render(container)
    rerender('abc', () => {
      return h('div', null, 'world hello')
    })
    expect(container.innerHTML).toBe('<div>world hello</div>')
    rerender('xxx', () => {
      return h('div', null, 'hello world')
    })
    expect(container.innerHTML).toBe('<div>world hello</div>')
  })

  test('collection of multi-dependent components', () => {
    const Foo = () => {
      return h('div', null, 'hello world')
    }
    const Bar = () => {
      return h(Foo)
    }
    const Baz = () => {
      return h(Foo)
    }
    Foo.__hmr_id = 'foo'
    Bar.__hmr_id = 'bar'
    Baz.__hmr_id = 'baz'
    createInstance(createVNode([h(Bar), h(Baz)])).render(container)
    expect(container.innerHTML).toBe(
      '<div>hello world</div><div>hello world</div>'
    )
    rerender('foo', () => {
      return h('div', null, 'world hello')
    })
    expect(container.innerHTML).toBe(
      '<div>world hello</div><div>world hello</div>'
    )
  })
})
