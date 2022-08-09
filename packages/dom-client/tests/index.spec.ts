import { mountProps, patchProps, createElement } from '../src'
import { createVNode } from 'gyron'
import { NS } from '../src/opt'

describe('Mount Props', () => {
  const container = createElement('div') as HTMLDivElement

  beforeEach(() => {
    container.innerHTML = ''
  })

  test('class style event', () => {
    const click = jest.fn()
    mountProps(
      container,
      createVNode('div', {
        class: 'container',
        style: {
          width: '10px',
        },
        onClick: click,
      })
    )
    expect(container.className).toBe('container')
    expect(container.style.width).toBe('10px')
    container.click()
    expect(click.mock.calls.length).toBe(1)
  })

  test('patch props', () => {
    const click = jest.fn()
    const n1 = createVNode('div', {
      class: 'container',
      style: {
        width: '10px',
      },
      onClick: click,
    })
    const n2 = createVNode('div', {
      class: 'container-1',
      disabled: true,
      style: 'height: 10px',
    })
    const n3 = createVNode('div', {
      class: 'container-1',
    })
    const n4 = createVNode('div', {
      class: '',
    })
    mountProps(container, n1)
    patchProps(container, n1, n2)
    expect(container.className).toBe('container-1')
    expect(container.style.width).toBe('')
    container.click()
    expect(click.mock.calls.length).toBe(0)
    patchProps(container, n2, n3)
    expect(container.className).toBe('container-1')
    patchProps(container, n3, n4)
    expect(container.className).toBe('')
  })

  test('svg patch', () => {
    const svg = createElement('svg')
    const n1 = createVNode('svg', {
      fill: '#fff',
    })
    const n2 = createVNode('svg')
    mountProps(svg, n1)
    expect(svg.getAttributeNS(NS, 'fill')).toBe('#fff')
    patchProps(svg, n1, n2)
    expect(svg.getAttributeNS(NS, 'fill')).toBe(null)
  })

  test('patch event and mount event', () => {
    const click1 = jest.fn()
    const click2 = jest.fn()
    const mouseenter = jest.fn()
    const n1 = createVNode('div', {
      onClick: click1,
      onMouseenter: mouseenter,
    })
    const n2 = createVNode('div', {
      onClick: click2,
    })
    mountProps(container, n1)
    container.dispatchEvent(new Event('mouseenter'))
    expect(mouseenter.mock.calls.length).toBe(1)
    patchProps(container, n1, n2)
    container.click()
    expect(click1.mock.calls.length).toBe(0)
    expect(click2.mock.calls.length).toBe(1)
    container.dispatchEvent(new Event('mouseenter'))
    expect(mouseenter.mock.calls.length).toBe(1)
    patchProps(container, n2, n2)
    container.click()
    expect(click2.mock.calls.length).toBe(2)
  })

  test('remove boolean attribute value', () => {
    const n1 = createVNode('div', {
      disabled: true,
    })
    const n2 = createVNode('div', {
      disabled: false,
    })
    mountProps(container, n1)
    expect(container.getAttribute('disabled')).toBe('')
    patchProps(container, n1, n2)
    expect(container.getAttribute('disabled')).toBeNull()
  })
})
