import { createInstance } from '@gyron/runtime'
import { h, jsx, jsxs } from '../src'

describe('jsx-runtime', () => {
  const container = document.createElement('div')

  beforeEach(() => {
    container.innerHTML = ''
  })

  test('h', () => {
    const node = h('div', null, 'hello', ' world')
    createInstance(node).render(container)
    expect(container.innerHTML).toBe('<div>hello world</div>')
  })

  test('component', () => {
    const node = h(() => {
      return h('div', null, 'hello', ' world')
    }, null)
    createInstance(node).render(container)
    expect(container.innerHTML).toBe('<div>hello world</div>')
  })

  test('jsx', () => {
    const node = jsx('div', { children: 'hello world' })
    createInstance(node).render(container)
    expect(container.innerHTML).toBe('<div>hello world</div>')
  })

  test('jsxs', () => {
    const node = jsxs('div', { children: ['hello', ' world'] })
    createInstance(node).render(container)
    expect(container.innerHTML).toBe('<div>hello world</div>')
  })
})
