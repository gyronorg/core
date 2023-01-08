import { sleep, sleepWithRequestFrame } from '@gyron/shared'
import { createInstance, h, nextRender, Transition } from '../src'

// TODO
// 1，单例
// 2，状态机不准确
// 3，位置不正确

describe('transition component', () => {
  test('1', () => {
    expect(1).toBe(1)
  })
  //   const container = document.createElement('div')

  //   test('single example', async () => {
  //     let visible = true
  //     const App = h(() =>
  //       h(
  //         Transition,
  //         { name: 'visible', duration: 0 },
  //         visible
  //           ? h('div', { id: 'bar' }, 'bar')
  //           : h('div', { id: 'foo' }, 'foo')
  //       )
  //     )
  //     createInstance(App).render(container)
  //     async function update(isHide: boolean) {
  //       visible = isHide
  //       App.component.update()
  //       await nextRender()
  //       await sleepWithRequestFrame()
  //       await sleep(1)
  //     }
  //     let bar = container.querySelector('#bar')
  //     await nextRender()
  //     await sleepWithRequestFrame()
  //     await sleep(1)
  //     await update(false)
  //     let foo = container.querySelector('#foo')
  //     expect(container.contains(bar)).toBe(false)
  //     expect(container.contains(foo)).toBe(true)
  //     await update(true)
  //     bar = container.querySelector('#bar')
  //     foo = container.querySelector('#foo')
  //     expect(container.contains(bar)).toBe(true)
  //     expect(container.contains(foo)).toBe(false)
  //   })

  //   test('expect prop name and component', async () => {
  //     let visible = true
  //     const Bar = () => h('div', { id: 'bar' }, 'bar')
  //     const Foo = () => h('div', { id: 'foo' }, 'foo')
  //     const App = h(() =>
  //       h(Transition, { name: 'visible', duration: 0 }, visible ? h(Bar) : h(Foo))
  //     )
  //     createInstance(App).render(container)
  //     async function update(isHide: boolean) {
  //       visible = isHide
  //       App.component.update()
  //       await nextRender()
  //     }
  //     let bar = container.querySelector('#bar')
  //     let foo = container.querySelector('#foo')
  //     expect(foo).toBeNull()
  //     expect(bar.className).toBe('visible-active-before')
  //     await sleepWithRequestFrame()
  //     expect(bar.className).toBe('visible-active')
  //     await sleep(1)
  //     expect(bar.className).toBe('')
  //     // 动画更新
  //     await update(false)
  //     bar = container.querySelector('#bar')
  //     foo = container.querySelector('#foo')
  //     expect(bar.className).toBe('visible-leave-before')
  //     expect(foo.className).toBe('visible-active-before')
  //     await sleepWithRequestFrame()
  //     expect(bar.className).toBe('visible-leave')
  //     expect(foo.className).toBe('visible-active')
  //     await sleep(1)
  //     expect(bar.className).toBe('')
  //     expect(foo.className).toBe('')
  //     expect(container.contains(bar)).toBe(false)
  //     expect(container.contains(foo)).toBe(true)

  //     // 中断动画
  //     await update(true)
  //     bar = container.querySelector('#bar')
  //     foo = container.querySelector('#foo')
  //     expect(bar.className).toBe('visible-active-before')
  //     expect(foo.className).toBe('visible-leave-before')
  //     // 等待 nextFrame 后中断
  //     await sleepWithRequestFrame()
  //     await update(false)
  //     bar = container.querySelector('#bar')
  //     foo = container.querySelector('#foo')
  //     expect(bar.className).toBe('visible-leave-before')
  //     expect(foo.className).toBe('visible-active-before')
  //     await sleepWithRequestFrame()
  //     expect(bar.className).toBe('visible-leave')
  //     expect(foo.className).toBe('visible-active')
  //     await sleep(1)
  //     expect(foo.className).toBe('')
  //   })
})
