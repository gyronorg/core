import { sleep, sleepWithRequestFrame } from '@gyron/shared'
import { createInstance, h, nextRender, Transition } from '../src'

describe('transition component', () => {
  const container = document.createElement('div')

  test('active to leave and to active', async () => {
    let visible = true
    const App = h(() => {
      return h(
        Transition,
        { name: 'visible', duration: 0 },
        visible ? h('div', { id: 'foo' }, 'foo') : null
      )
    })
    createInstance(App).render(container)
    let foo = container.querySelector('#foo')
    expect(foo.className).toBe('visible-active-before')
    await sleepWithRequestFrame()
    expect(foo.className).toBe('visible-active')
    await sleep(1)
    expect(foo.className).toBe('')
    visible = false
    App.component.update()
    await nextRender()
    foo = container.querySelector('#foo')
    expect(foo.className).toBe('visible-leave-before')
    await sleepWithRequestFrame()
    expect(foo.className).toBe('visible-leave')
    await sleep(1)
    expect(foo.className).toBe('')
  })

  test('expect prop name and component', async () => {
    // let visible = true
    // const Foo = h(() => {
    //   return h('div', { id: 'foo' }, 'foo')
    // })
    // const Bar = h('div', { id: 'bar' }, 'bar')
    // const App = h(() => {
    //   return h(
    //     Transition,
    //     { name: 'visible', duration: 0 },
    //     visible ? Bar : Foo
    //   )
    // })
    // createInstance(App).render(container)
    // let bar = container.querySelector('#bar')
    // visible = false
    // bar = container.querySelector('#bar')
  })
})
