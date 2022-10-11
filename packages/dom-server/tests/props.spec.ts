import { createVNode } from '@gyron/runtime'
import { renderToString } from '../src'

describe('Props', () => {
  test('class style', async () => {
    const html = await renderToString(
      createVNode('div', {
        class: 'container',
        style: {
          width: '10px',
          height: '10px',
        },
      })
    )
    expect(html).toBe(
      '<div class="container" style="width: 10px; height: 10px"></div>'
    )
  })

  test('string style', async () => {
    const html = await renderToString(
      createVNode('div', {
        style: 'width: 10px',
      })
    )
    expect(html).toBe('<div style="width: 10px"></div>')
  })

  test('lower case style', async () => {
    const html = await renderToString(
      createVNode('div', {
        style: {
          textAlign: 'center',
        },
      })
    )
    expect(html).toBe('<div style="text-align: center"></div>')
  })

  test('className to class', async () => {
    const html = await renderToString(
      createVNode('div', {
        className: 'container',
      })
    )
    expect(html).toBe('<div class="container"></div>')
  })

  test('any attr', async () => {
    const html = await renderToString(
      createVNode('div', {
        disable: true,
      })
    )
    expect(html).toBe('<div disable="true"></div>')
  })

  test('component class style', async () => {
    const html = await renderToString(
      createVNode(() => {
        return createVNode(
          'div',
          {
            class: 'container',
          },
          'text'
        )
      })
    )
    expect(html).toBe('<div class="container">text</div>')
  })

  test('element _html attribute', async () => {
    const html = await renderToString(createVNode('span', { _html: 'Gyron' }))
    expect(html).toBe('<span>Gyron</span>')
  })

  test('should warn with _html and children', async () => {
    const fn = jest.fn()
    const warn = console.warn
    console.warn = fn
    const html = await renderToString(
      createVNode('span', { _html: 'Gyron1' }, 'Gyron2')
    )
    expect(html).toBe('<span>Gyron2</span>')
    expect(fn).toHaveBeenCalled()
    console.warn = warn
  })
})
