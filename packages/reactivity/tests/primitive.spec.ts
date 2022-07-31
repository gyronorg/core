import { useValue, useEffect } from '../src/index'

describe('useValue', () => {
  test('value', () => {
    const original = useValue(0)
    expect(original.value).toBe(0)
  })

  test('useEffect', () => {
    const original = useValue(0)
    let dummy: number
    useEffect(() => {
      dummy = original.value
    })

    expect(dummy).toBe(0)

    original.value = 1
    expect(dummy).toBe(1)
  })

  test('response of deep objects', () => {
    const original = useValue({ x: 0 })
    let dummy: number
    useEffect(() => {
      dummy = original.value.x
    })

    expect(dummy).toBe(0)

    original.value.x = 1
    expect(dummy).toBe(1)
  })

  test('the attributes of the array also have a response', () => {
    const original = useValue([])
    let dummy: number
    useEffect(() => {
      dummy = original.value.length
    })
    expect(dummy).toBe(0)
    original.value.push(1)
    expect(dummy).toBe(1)
    original.value[3] = 3
    expect(dummy).toBe(4)
  })

  test('includes indexOf lastIndexOf', () => {
    const original = useValue([])
    let dummy: boolean
    useEffect(() => {
      dummy = original.value.includes(0)
    })
    expect(dummy).toBe(false)
    original.value.push(0)
    expect(dummy).toBe(true)
  })
})
