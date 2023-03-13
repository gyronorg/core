import { createInstance, FC, h, nextRender, onAfterUpdate } from '../src'

function createUpdateApp(A: any) {
  const APP = h(() => {
    return h('div', {}, A)
  })
  const instance = createInstance(APP)
  return {
    APP,
    instance,
  }
}

describe('performance', () => {
  const container = document.createElement('div')

  beforeEach(() => {
    container.innerHTML = ''
  })

  test('skip (element)', async () => {
    let a = 1
    const { instance, APP } = createUpdateApp(
      h(() => [h('div', { static: true }, a), h('div', { static: false }, a)])
    )
    instance.render(container)
    a = 2
    APP.component.update()
    await nextRender()
    expect(container.innerHTML).toBe('<div><div>1</div><div>2</div></div>')
  })

  test('skip updates after setting static (component)', async () => {
    const fn = jest.fn()
    const Child = FC(({ children }) => {
      fn()
      return h('div', null, children)
    })
    const { instance, APP } = createUpdateApp([
      h(Child, { static: true }),
      h(Child, { static: false }),
    ])
    instance.render(container)
    expect(fn).toHaveBeenCalledTimes(2)
    APP.component.update()
    await nextRender()
    expect(fn).toHaveBeenCalledTimes(3)
  })

  test('memo attribute with element', async () => {
    const update = jest.fn()
    const Child = () => {
      onAfterUpdate(update)
      return h('div', 'child')
    }
    const APP = h(() => {
      return h('div', { memo: [1, 2] }, h(Child))
    })
    createInstance(APP).render(container)
    APP.component.update()
    await nextRender()
    expect(update).toHaveBeenCalledTimes(0)
  })

  test('memo attribute with component', async () => {
    const update = jest.fn()
    const Foo = () => {
      onAfterUpdate(update)
      return () => h('div', 'foo')
    }
    const APP = h(() => {
      return h(Foo, { memo: [1, 2] })
    })
    createInstance(APP).render(container)
    APP.component.update()
    await nextRender()
    expect(update).toHaveBeenCalledTimes(0)
  })
})
