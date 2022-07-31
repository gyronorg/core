import {
  useComputed,
  useMemo,
  useReactive,
  useEffect,
  useValue,
} from '../src/index'

describe('useComputed', () => {
  test('observe data', () => {
    const original = useReactive({
      x: 0,
      y: 0,
    })
    const observed = useComputed(() => {
      return original.x + 1
    })

    expect(observed.value).toBe(1)
    original.x = 1

    expect(observed.value).toBe(2)
  })

  test('observe deep useComputed', () => {
    const original = useReactive({
      x: 0,
      y: 0,
    })
    const observed = useComputed(() => {
      return original.x
    })
    const observed2 = useComputed(() => {
      return observed.value * 2
    })

    original.x = 2
    expect(observed.value).toBe(2)
    expect(observed2.value).toBe(4)
  })

  test('useValue useComputed', () => {
    const a1 = useValue(0)
    const a2 = useComputed(() => {
      return a1.value * 2
    })
    expect(a2.value).toBe(0)
    a1.value = 1
    expect(a2.value).toBe(2)
    a1.value = 2
    expect(a2.value).toBe(4)
  })

  test('useComputed dep', () => {
    // x -> dep[0] = () => return a0.x * 2
    //
    const a0 = useReactive({ x: 0 })
    // dep[0] = () => a2 = a1.value * 2
    const a1 = useComputed(() => {
      return a0.x * 2
    })
    let a2: number
    useEffect(() => {
      a2 = a1.value * 2
    })
    a0.x = 1
    expect(a2).toBe(4)

    // 1，activeEffect 是 a2。
    // 2，取 a1 的值，a1 的 dep push a2；
    //    a2 的 deps push a1 的 dep；
    //    activeEffect 是 a1
    // 3，取 a0 的值，a0 的 dep push a1（activeEffect）。
    // 4，改变 a0 的值，找到 a0 的 dep，也就是 a1。
    // 5，通过实例化 useComputed 时传递的 scheduler 触发 a1 的 dep（也就是a2）
  })

  test('useComputed memo data', () => {
    const timeSetter = jest.fn()
    const deferredTimeSetter = jest.fn()
    const count = useValue(0)
    const time = useComputed(() => {
      timeSetter()
    })
    const deferredTime = useMemo(() => {
      deferredTimeSetter()
      return count.value
    })
    time.value
    deferredTime.value
    expect(timeSetter.mock.calls.length).toBe(1)
    expect(deferredTimeSetter.mock.calls.length).toBe(1)
    time.value
    deferredTime.value
    expect(timeSetter.mock.calls.length).toBe(2)
    expect(deferredTimeSetter.mock.calls.length).toBe(1)
    count.value = 1
    deferredTime.value
    expect(deferredTimeSetter.mock.calls.length).toBe(2)
  })

  test('useComputed dependency', () => {
    const trigger = useValue(true)
    const foo = useValue(0)
    const bar = useComputed(() => ++foo.value, [() => trigger.value])
    expect(bar.value).toBe(1)
    trigger.value = !trigger.value
    expect(bar.value).toBe(2)
    expect(foo.value).toBe(2)
  })

  test('useComputed memo dependency', () => {
    const trigger = useValue(true)
    const foo = useValue(0)
    const bar = useMemo(() => ++foo.value, [() => trigger.value])
    const baz = useComputed(() => bar.value)
    expect(bar.value).toBe(1)
    expect(baz.value).toBe(1)
    trigger.value = !trigger.value
    expect(baz.value).toBe(2)
    trigger.value = !trigger.value
    expect(baz.value).toBe(3)
  })
})
