import { createInstance, h, nextRender, useValue } from 'gyron'
import { createElement } from '../src'

describe('Controlled element', () => {
  const container = createElement('div') as HTMLDivElement
  const options = [
    h(
      'option',
      {
        value: 'foo',
      },
      'foo'
    ),
    h(
      'option',
      {
        value: 'bar',
      },
      'bar'
    ),
  ]

  beforeEach(() => {
    container.innerHTML = ''
  })

  test('select single', async () => {
    const value = useValue('foo')
    const App = h(() => {
      return h(
        'select',
        {
          value: value.value,
        },
        options
      )
    })
    createInstance(App).render(container)
    const select = container.querySelector('select')
    expect(select.selectedIndex).toBe(0)
    value.value = ''
    await nextRender()
    expect(select.selectedIndex).toBe(-1)
    value.value = 'foo'
    await nextRender()
    expect(select.selectedIndex).toBe(0)
  })

  test('select multiple', async () => {
    const value = useValue(['foo'])
    createInstance(
      h(() => {
        return h(
          'select',
          {
            value: value.value,
            multiple: 'multiple',
          },
          options
        )
      })
    ).render(container)
    const el = container.querySelector('select')
    expect(el.value).toBe('foo')
    value.value.push('bar')
    await nextRender()
    expect(el.selectedOptions.length).toBe(2)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    value.value = new Set()
    await nextRender()
    expect(el.selectedOptions.length).toBe(0)
  })

  test('input change to input and value is not attribute', async () => {
    const fn = jest.fn((e) => {
      value.value = e.target.value.toLocaleUpperCase()
    })
    const value = useValue('')
    createInstance(
      h(() => {
        return () =>
          h('input', {
            value: value.value,
            onInput: fn,
          })
      })
    ).render(container)
    const el = container.querySelector('input')
    el.value = 'foo'
    el.dispatchEvent(new Event('input'))
    expect(fn.mock.calls.length).toBe(1)
    expect(el.getAttribute('value')).toBe(null)
    expect(value.value).toBe('FOO')

    await nextRender()
    expect(el.value).toBe('FOO')
  })

  test('input radio and checkbox', () => {
    createInstance(
      h(() => {
        return () => [
          h('input', {
            type: 'radio',
            checked: true,
          }),
          h('input', {
            type: 'checkbox',
            checked: false,
          }),
        ]
      })
    ).render(container)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    expect(container.querySelector('input[type="radio"]').checked).toBe(true)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    expect(container.querySelector('input[type="checkbox"]').checked).toBe(
      false
    )
  })
})
