import {
  insert,
  append,
  remove,
  createText,
  createComment,
  createElement,
  nextSibling,
  querySelector,
} from '../src'

describe('dom interface implementation', () => {
  test('opt', () => {
    const div = createElement('div')
    const anchor = createComment()
    const text = createText('gyron.js')
    const next = createText('!')
    append(anchor, div)
    expect(div.innerHTML).toBe('<!---->')
    insert(text, div, anchor)
    expect(div.innerHTML).toBe('gyron.js<!---->')
    remove(anchor)
    expect(div.innerHTML).toBe('gyron.js')
    append(next, div)
    expect(nextSibling(text)).toBe(next)
    const container = createElement('div')
    insert(createText('gyron.js'), container)
    expect(container.innerHTML).toBe('gyron.js')
    const svg = createElement('svg', true)
    const path = createElement('path', true)
    append(path, svg)
    expect(svg.innerHTML).toBe('<path></path>')
    expect(querySelector('path', svg)).toBe(path)
  })

  test('slice text proxy', () => {
    const container = createElement('div')
    const hello = createText('hello')
    const world = createText('world')
    append(hello, container)
    append(createComment('|'), container)
    append(world, container)
    expect(nextSibling(hello)).toBe(world)
  })
})
