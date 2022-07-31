import { readonly, readwrite } from '@gyron/shared'
import { useReactive } from '../src'

describe('Readonly', () => {
  test('count', () => {
    const state = useReactive(
      {
        count: 0,
      },
      true
    )
    const f = jest.fn(() => {
      expect(state.count).toBe(0)
    })
    try {
      state.count = 1
    } catch (_) {
      f()
    }
    expect(f.mock.calls.length).toBe(1)
  })

  test('array', () => {
    const state = useReactive(
      {
        counts: [],
      },
      true
    )
    const f = jest.fn(() => {
      expect(state.counts.length).toBe(0)
    })
    try {
      state.counts.push(0)
    } catch (_) {
      f()
    }
    // TODO readonly array
    // expect(f.mock.calls.length).toBe(1)
  })

  test('immutable object', () => {
    const state = useReactive(
      {
        count: 0,
      },
      true
    )
    readwrite(state)
    state.count = 0
    expect(state.count).toBe(0)
    readonly(state)
    const f = jest.fn(() => {
      expect(state.count).toBe(0)
    })
    try {
      state.count = 1
    } catch (_) {
      f()
    }
    expect(f.mock.calls.length).toBe(1)
  })
})
