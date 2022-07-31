import {
  useReactive,
  useEffect,
  useValue,
  useComputed,
  pauseTrack,
  enableTrack,
  cleanupTrackEffect,
  asyncTrackEffect,
  clearTrackEffect,
  ReactiveEffect,
} from '../src'

describe('useEffect', () => {
  test('reactivity', () => {
    const original = useReactive({
      x: 0,
      y: 0,
    })
    let dummy: number
    const _effect = useEffect(() => {
      dummy = original.x
    })

    expect(typeof _effect).toBe('function')
    expect(dummy).toBe(0)
    original.x = 1
    expect(dummy).toBe(1)
  })

  test('deep useEffect useValue', () => {
    const a1 = useValue(0)
    const a2 = useComputed(() => {
      return a1.value + 1
    })
    const a3 = useComputed(() => {
      return a2.value + 1
    })
    let dummy: number
    useEffect(() => {
      dummy = a3.value + 1
    })
    a1.value = 10
    expect(dummy).toBe(13)
  })

  test('deep useEffect reactivity', () => {
    const a1 = useReactive({ x: 0 })
    const a2 = useComputed(() => {
      return a1.x + 1
    })
    const a3 = useComputed(() => {
      return a2.value + 1
    })
    let dummy: number
    useEffect(() => {
      dummy = a3.value + 1
    })
    a1.x = 10
    expect(dummy).toBe(13)
  })

  test('stop useEffect and ', () => {
    const a1 = useReactive({ x: 0 })
    let dummy: number
    const s = useEffect(() => {
      dummy = a1.x
    })
    expect(dummy).toBe(0)
    s.effect.stop()
    a1.x = 1
    expect(dummy).toBe(0)
  })

  test('useEffect dependency', () => {
    let count = 1
    let dummy: number
    const trigger = useValue(true)
    useEffect(() => {
      dummy = count
    }, [() => trigger.value])
    expect(dummy).toBe(1)
    count = 2
    expect(dummy).toBe(1)
    trigger.value = !trigger.value
    expect(dummy).toBe(2)
  })

  test('should track or not', () => {
    const count = useValue(0)
    let dummy: number, noTrack: number
    useEffect(() => {
      dummy = count.value
    })
    pauseTrack()
    useEffect(() => {
      noTrack = count.value
    })
    enableTrack()
    expect(dummy).toBe(0)
    expect(noTrack).toBe(0)
    count.value = 1
    expect(dummy).toBe(1)
    expect(noTrack).toBe(0)
  })

  test('cleanup track useEffect', () => {
    const count = useValue(0)
    let dummy: number
    useEffect(() => {
      dummy = count.value
    })
    cleanupTrackEffect(count, 'value')
    count.value = 1
    expect(dummy).toBe(0)
  })

  test('async track useEffect', async () => {
    const count = useValue(0)
    let dummy: number
    const useEffect = new ReactiveEffect(
      () => {
        Promise.resolve().then(() => {
          asyncTrackEffect(useEffect)
          dummy = count.value
          clearTrackEffect()
        })
      },
      () => {
        dummy = count.value
      }
    )
    useEffect.run()
    await Promise.resolve()
    expect(dummy).toBe(0)
    count.value = 10
    expect(dummy).toBe(10)
  })
})
