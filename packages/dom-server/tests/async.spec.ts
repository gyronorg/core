import { createText, h } from 'gyron'
import { sleep } from '@gyron/shared'
import { renderToString } from '../src'

describe('Async', () => {
  test('server async component', async () => {
    const App = async () => {
      await sleep(0)
      return h('div', '1')
    }
    const html = await renderToString(h(App))
    expect(html).toBe('<div>1</div>')
  })

  test('plain text', async () => {
    const App = async () => {
      await sleep(0)
      return createText('foo')
    }
    const html = await renderToString(h(App))
    expect(html).toBe('foo')
  })
})
