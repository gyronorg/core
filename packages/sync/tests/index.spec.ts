import { sync } from '../src'

describe('Sync', () => {
  test('[Sync] Kid N', () => {
    const a1 = {
      a: 1,
    }
    const a2 = {}
    sync(a2, a1)
    expect((a2 as any).a).toBe(1)
  })

  test('[Sync] Kid D', () => {
    const a1 = {
      a: 1,
    }
    const a2 = {}
    sync(a1, a2)
    expect(typeof a1.a).toBe('undefined')
  })

  test('[Sync] Kid E', () => {
    const a1 = {
      a: 1,
    }
    const a2 = {
      a: 2,
    }
    sync(a1, a2)
    expect(a1.a).toBe(2)
  })

  test('[Sync] Kid A - A', () => {
    const a1 = {
      a: [],
    }
    const a2 = {
      a: ['test'],
    }
    sync(a1, a2)
    expect(a1.a).toEqual(['test'])
  })

  test('[Sync] Kid A - D', () => {
    const a1 = {
      a: ['a', 'b', 'c'],
    }
    const a2 = {
      a: ['a', 'c'],
    }
    sync(a1, a2)
    expect(a1.a).toEqual(['a', 'c'])
  })

  test('[Sync] Kid A - object D', () => {
    const a1 = {
      a: ['a', 'b', 'c'],
    }
    const a2 = {
      a: ['a', { name: 'Link' }],
    }
    sync(a1, a2)
    expect(a1.a).toEqual(['a', { name: 'Link' }])
  })

  test('[Sync] Kid A - object E', () => {
    const a1 = {
      a: ['a', { name: 'David' }],
    }
    const a2 = {
      a: ['a', { name: 'Link' }],
    }
    sync(a1, a2)
    expect(a1.a).toEqual(['a', { name: 'Link' }])
  })
})
