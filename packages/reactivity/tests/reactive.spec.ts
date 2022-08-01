import { sleep } from '@gyron/shared'
import {
  useReactive,
  useEffect,
  useComputed,
  toRaw,
  useValue,
  createEffect,
  isResponsive,
} from '../src'

describe('useReactive', () => {
  test('reactivity', () => {
    const original = {
      x: 0,
      y: 0,
    }
    const observed = useReactive(original)

    observed.x = 1
    expect(original.x).toBe(1)
    expect(observed.x).toBe(1)
  })

  test('response depth object', () => {
    const original = useReactive({
      y: {
        n: 0,
      },
    })
    let dummy: number, dummy1: number
    useEffect(() => {
      dummy = original.y.n
    })
    useEffect(() => {
      dummy1 = original.y.n + 1
    })

    original.y.n = 1
    expect(dummy).toBe(1)
    expect(dummy1).toBe(2)
  })

  test('reactivity array', () => {
    const original = useReactive<number[]>([])
    let dummy: number
    useEffect(() => {
      dummy = original[0]
    })
    expect(dummy).toBe(undefined)
    original.push(1)
    expect(dummy).toBe(1)
  })

  test('reactivity deep array of object', () => {
    const original = useReactive({
      x: [-1],
    })
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const dummy = 0
    useEffect(() => {
      original.x.map((x) => x)
      // console.log(++dummy)
    })
    original.x.splice(0, 0, original.x.length)
    original.x.splice(0, 0, original.x.length)
  })

  test('delete reactivity prop', () => {
    const state = useReactive({
      x: 0,
    })
    const x1 = useComputed(() => {
      return state.x + 1
    })
    expect(x1.value).toBe(1)
    delete state.x
    expect(state.x).toBe(undefined)
    expect(Number.isNaN(x1.value)).toBe(true)
  })

  test('listening to set and map datasets', () => {
    const set = useReactive(new Set(['foo']))
    expect(set.has('foo')).toBe(true)
    class CustomMap extends Map {}
    const map = useReactive(new CustomMap())
    map.set('foo', true)
    expect(map.get('foo')).toBe(true)
  })

  test('update of the data set', () => {
    const set = useReactive(new Set([]))
    let dummy: boolean
    useEffect(() => {
      dummy = set.has('foo')
    })
    expect(dummy).toBe(false)
    set.add('foo')
    expect(dummy).toBe(true)
    expect(set.size).toBe(1)
    set.forEach((value) => {
      expect(value).toBe('foo')
    })
    set.delete('foo')
    expect(set.size).toBe(0)
    set.add('foo')
    set.add('bar')
    expect([...set.values()].length).toBe(2)
    set.clear()
    expect(set.size).toBe(0)
  })

  test('map key is useReactive', () => {
    const map = useReactive(new Map())
    const key = useReactive({})
    map.set(key, 'foo')
    expect(map.get(key)).toBe('foo')
  })

  test('to raw', () => {
    const original = useReactive({
      count: 0,
    })
    let dummy: number
    useEffect(() => {
      dummy = toRaw(original).count
    })
    expect(dummy).toBe(0)
    original.count = 1
    expect(dummy).toBe(0)

    expect(toRaw(useValue(0))).toBe(0)
    expect(toRaw(useComputed(() => 1))).toBe(1)
  })

  test('useReactive useEffect', () => {
    const count = useValue(0)
    let dummy: number
    const useEffect = createEffect(
      () => {
        count.value
      },
      () => {
        dummy = 1
      }
    )
    useEffect.run()
    expect(dummy).toBe(undefined)
    count.value = 0x11
    expect(dummy).toBe(1)
  })

  test('useEffect nesting', async () => {
    const scheduler = jest.fn()
    const effectMock = jest.fn()
    const update = createEffect(() => {
      const count = useValue(0)
      useEffect(effectMock, [() => count.value])
      sleep(0).then(() => {
        count.value = 1
      })
      count.value
    }, scheduler)
    update.run()
    expect(scheduler.mock.calls.length).toBe(0)
    expect(effectMock.mock.calls.length).toBe(1)
    await sleep(50)
    expect(scheduler.mock.calls.length).toBe(1)
    expect(effectMock.mock.calls.length).toBe(2)
  })

  test('object keys', () => {
    const original = useReactive<{ x?: number }>({})
    const effectMock = jest.fn(() => {
      Object.keys(original)
    })
    useEffect(effectMock)
    expect(effectMock.mock.calls.length).toBe(1)
    original.x = 1
    expect(effectMock.mock.calls.length).toBe(2)
  })

  test('isResponsive', () => {
    expect(isResponsive({})).toBe(false)
    expect(isResponsive(useReactive({}))).toBe(true)
  })

  test('readonly', () => {
    const original = useReactive(
      {
        count: 0,
      },
      true
    )
    try {
      delete original.count
    } catch (e) {
      expect(String(e)).toContain('TypeError')
    }
  })
})
