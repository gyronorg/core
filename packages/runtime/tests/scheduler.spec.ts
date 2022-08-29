import { createInstance, h, onBeforeUpdate, useValue } from '../src'
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
    const App = h(() => {
      onBeforeUpdate(() => {
        fakeDeath(10)
      })
      return h('div', null, update[0].value + update[1].value)
    })
    createInstance(App).render(container)
    update[0].value = update[1].value = 1
    await nextRender()
    expect(container.innerHTML).toBe('<div>2</div>')
  })
})
