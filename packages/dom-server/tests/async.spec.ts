import { createVNode, h, FCA } from '@gyron/runtime'
import { sleep } from '@gyron/shared'
import { renderToString } from '../src'

describe('Async', () => {
  test('server async component', async () => {
    const App = async () => {
      await sleep(0)
      return h('div', 'gyron')
    }
    const html = await renderToString(h(App))
    expect(html).toBe('<div>gyron</div>')
  })

  test('plain text', async () => {
    const App = async () => {
      await sleep(0)
      return createVNode('foo')
    }
    const html = await renderToString(h(App))
    expect(html).toBe('foo')
  })

  test('render the FCA component to string', async () => {
    const App = FCA(() => {
      return Promise.resolve(h('div', 'gyron'))
    })
    const html = await renderToString(h(App))
    expect(html).toBe('<div>gyron</div>')
  })
})
