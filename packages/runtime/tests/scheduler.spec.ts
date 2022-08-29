import {
  createInstance,
  createVNode,
  h,
  isVNodeComponent,
  onAfterUpdate,
  onBeforeUpdate,
  useValue,
} from '../src'
import { nextRender, now } from '../src/scheduler'

function fakeDeath(ms: number) {
  const start = now()
  const arr = Array.from({ length: 1 << 10 }).fill(true)
  for (let i = 0; i < arr.length; i++) {
    for (let j = arr.length; j > 0; j--) {
      i
      j
    }
  }
  const elapsed = now() - start
  if (elapsed < ms) {
    fakeDeath(ms - elapsed)
  }
}

describe('scheduler', () => {
  const container = document.createElement('div')

  beforeEach(() => {
    container.innerHTML = ''
  })

  test('10ms', () => {
    const start = performance.now()
    fakeDeath(10)
    const timeElapsed = performance.now() - start
    expect(timeElapsed > 10).toBe(true)
  })

  test('timeout', async () => {
    const update = [useValue(0), useValue(0)]
    const App1 = h(() => {
      onBeforeUpdate(() => {
        fakeDeath(10)
      })
      return h('div', null, update[0].value)
    })
    const App2 = h(() => {
      onBeforeUpdate(() => {
        fakeDeath(10)
      })
      return h('div', null, update[1].value)
    })
    createInstance(createVNode([App1, App2])).render(container)
    update[0].value = update[1].value = 1
    await nextRender()
    expect(container.innerHTML).toBe('<div>1</div><div>1</div>')
  })

  test('clear component update id', async () => {
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
    await nextRender()
    expect(fn).toHaveBeenCalledTimes(2)
    expect(isVNodeComponent(App)).toBe(true)
  })
})
