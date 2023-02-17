import { sleep, sleepWithRequestFrame } from '@gyron/shared'
import { createInstance, h, nextRender, Transition } from '../src'
import { whenTransitionEnd } from '../src/internal'

describe('transition component', () => {
  const container = document.createElement('div')

  test('single example', async () => {
    let visible = true
    const App = h(() =>
      h(
        Transition,
        { name: 'visible', duration: 0 },
        visible
          ? h('div', { id: 'bar', key: 0 }, 'bar')
          : h('div', { id: 'foo', key: 1 }, 'foo')
      )
    )
    async function update(isHide: boolean) {
      visible = isHide
      App.component.update()
      await nextRender()
    }
    createInstance(App).render(container)
    let bar = container.querySelector('#bar')
    let foo = container.querySelector('#foo')
    expect(bar.className).toBe('visible-active-before')
    await sleepWithRequestFrame()
    expect(bar.className).toBe('visible-active')
    await sleep(1)
    expect(bar.className).toBe('')
    expect(container.contains(bar)).toBe(true)
    await update(false)
    bar = container.querySelector('#bar')
    foo = container.querySelector('#foo')
    expect(bar.className).toBe('visible-leave-before')
    expect(foo.className).toBe('visible-active-before')
    await sleepWithRequestFrame()
    expect(bar.className).toBe('visible-leave')
    expect(foo.className).toBe('visible-active')
    await sleep(1)
    expect(bar.className).toBe('')
    expect(foo.className).toBe('')
    expect(container.contains(bar)).toBe(false)
    expect(container.contains(foo)).toBe(true)
  })

  test('no transition css', async () => {
    const done = jest.fn()
    whenTransitionEnd(container, null, done, {
      transition: 'all 0s ease 0s',
    })
    expect(done).toHaveBeenCalled()
  })
})
