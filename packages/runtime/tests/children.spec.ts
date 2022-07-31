import {
  createInstance,
  nextRender,
  createVNode,
  h,
  useRef,
  createFragment,
} from '../src'
import { useValue } from '@gyron/reactivity'
import { createText } from '@gyron/dom-client'

describe('Children', () => {
  const container = document.createElement('div')

  beforeEach(() => {
    container.innerHTML = ''
  })

  test('plain list', async () => {
    const state = useValue('0')
    const Child = () => {
      return ['1', state.value, '2']
    }
    createInstance(h(Child)).render(container)
    expect(container.innerHTML).toBe('102')
    state.value = '1'
    await nextRender()
    expect(container.innerHTML).toBe('112')
  })

  test('call expression list', async () => {
    const state = useValue([])
    const Child = () => {
      return createVNode('div', null, [
        'before',
        ...state.value.map((x) => createVNode('span', {}, x)),
        'after',
      ])
    }
    createInstance(h(Child)).render(container)
    let children = container.querySelectorAll('span')
    expect(children.length).toBe(0)
    state.value.push(state.value.length)
    await nextRender()
    children = container.querySelectorAll('span')
    expect(children.length).toBe(1)
    state.value.push(state.value.length)
    await nextRender()
    expect(container.innerHTML).toBe(
      '<div>before<span>0</span><span>1</span>after</div>'
    )
  })

  test('anchor', async () => {
    const p = useRef<HTMLElement>()
    const fragment = createFragment([
      createVNode('span', {}, 'before'),
      createVNode('span', {}, 'middle'),
      createVNode('span', {}, 'after'),
    ])
    const node = createVNode('p', { ref: p }, fragment)
    createInstance(node).render(container)
    const children = p.current
    expect(children.childNodes[0].textContent).toBe('before')
    expect(children.childNodes[1].textContent).toBe('middle')
    expect(children.childNodes[2].textContent).toBe('after')
    expect(fragment.anchor).toEqual(createText(''))
  })

  test('render deep component and react content', async () => {
    const list = useValue('')
    const Son = () => {
      return list.value
    }
    const Child = () => {
      return h(Son)
    }
    createInstance(h(Child)).render(container)
    expect(container.innerHTML).toBe('')
    list.value = '1'
    await nextRender()
    expect(container.innerHTML).toBe('1')
  })

  test('next render', async () => {
    const t1 = useValue('')
    const t2 = useValue('')
    const Son = () => {
      return t1.value
    }
    const Child = () => {
      return createVNode(
        'span',
        {
          id: 'child',
        },
        [t2.value, h(Son)]
      )
    }
    createInstance(h(Child)).render(container)
    const child = container.querySelector('#child')
    t1.value = '1'
    await nextRender()
    expect(child).toBe(container.querySelector('#child'))
    t2.value = '2'
    await nextRender()
    expect(child).toBe(container.querySelector('#child'))
    expect(container.querySelector('#child').innerHTML).toBe('21')
  })

  test('comment', async () => {
    const state = useValue(false)
    const Child = () => {
      return state.value && '1'
    }
    createInstance(h(Child)).render(container)
    expect(container.innerHTML).toBe('<!---->')
    state.value = true
    await nextRender()
    expect(container.innerHTML).toBe('1')
    state.value = false
    await nextRender()
    expect(container.innerHTML).toBe('<!---->')
  })
})
