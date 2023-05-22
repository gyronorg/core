import {
  keys,
  isUndefined,
  isNull,
  isArray,
  isSet,
  isCollection,
  shouldValue,
  extend,
  isEmpty,
  isObject,
  isElement,
  isComment,
  isPromise,
  noop,
  isBoolean,
  isString,
  isNumber,
  isPlanObject,
  isFunction,
  hasChanged,
  readonly,
  readwrite,
  isReadonly,
  isEqual,
  omit,
  merge,
  sleep,
  escape,
  diffWord,
  deepArrayFind,
  deepObjectMap,
  join,
  resolve,
  isMap,
  isIntegerKey,
  isEventProps,
  normalizeEventName,
  removeWithString,
  at,
} from '../src'

describe('Common function', () => {
  test('keys', () => {
    expect(keys({ a: 0 }).length).toBe(1)
    expect(keys(null).length).toBe(0)
  })

  test('isUndefined', () => {
    expect(isUndefined(undefined)).toBe(true)
  })

  test('isNull', () => {
    expect(isNull(null)).toBe(true)
  })

  test('isArray', () => {
    expect(isArray([])).toBe(true)
  })

  test('isSet', () => {
    expect(isSet([])).toBe(false)
    expect(isSet(new Set())).toBe(true)
  })

  test('isCollection', () => {
    expect(isCollection([])).toBe(false)
    expect(isCollection(new Set())).toBe(true)
    expect(isCollection(new Map())).toBe(true)
    expect(isCollection(new WeakMap())).toBe(true)
    expect(isCollection(new WeakSet())).toBe(true)
  })

  test('shouldValue', () => {
    expect(shouldValue([])).toBe(false)
    expect(shouldValue('')).toBe(true)
  })

  test('extend', () => {
    expect(extend({}, { foo: 'foo' }).foo).toBe('foo')
  })

  test('isEmpty', () => {
    expect(isEmpty({})).toBe(true)
  })

  test('isObject', () => {
    expect(isObject({})).toBe(true)
  })

  test('isElement', () => {
    expect(isElement(document)).toBe(true)
  })

  test('isComment', () => {
    expect(isComment(document.createComment(''))).toBe(true)
  })

  test('isPromise', () => {
    expect(isPromise(Promise.resolve())).toBe(true)
    expect(isPromise(noop)).toBe(false)
  })

  test('isBoolean', () => {
    expect(isBoolean('foo')).toBe(false)
    expect(isBoolean(false)).toBe(true)
  })

  test('isString', () => {
    expect(isString('')).toBe(true)
    expect(isString(1)).toBe(false)
  })

  test('isNumber', () => {
    expect(isNumber(0)).toBe(true)
  })

  test('isPlanObject', () => {
    expect(isPlanObject({})).toBe(true)
    class A {}
    expect(isPlanObject(new A())).toBe(false)
  })

  test('isFunction', () => {
    expect(isFunction(noop)).toBe(true)
  })

  test('hasChanged', () => {
    expect(hasChanged(NaN, NaN)).toBe(false)
    expect(hasChanged(NaN, null)).toBe(true)
  })

  test('readonly readwrite isReadonly', () => {
    const obj = {
      a: 0,
      b: {
        c: 0,
      },
    }
    readonly(obj)
    expect(isReadonly(obj, 'a')).toBe(true)
    try {
      obj.a = 1
    } catch (e) {}
    expect(obj.a).toBe(0)
    readwrite(obj)
    obj.a = 1
    expect(obj.a).toBe(1)
    expect(isReadonly(obj, 'a')).toBe(false)
    expect(isReadonly(obj, 'c')).toBe(false)
  })

  test('isEqualBy', () => {
    expect(isEqual({}, { a: 1 })).toBe(false)
    expect(isEqual({ a: 1, b: 1 }, { a: 2, b: 2 }, 'a')).toBe(false)
    expect(isEqual({ a: 1, b: 1 }, { a: 2, b: 1 }, 'a')).toBe(true)
    expect(isEqual({ a: 1, b: [1, '2'] }, { a: 1, b: [1, '2'] })).toBe(true)
    expect(isEqual(null, null)).toBe(true)
    expect(isEqual(undefined, undefined)).toBe(true)
  })

  test('omit', () => {
    expect(omit({ a: 0, b: 0 }, 'a')).toMatchObject({ b: 0 })
    expect(omit({ a: 0, b: 0 }, ['a', 'b'])).toMatchObject({})
  })

  test('merge', () => {
    expect(merge({}, { a: 0 }).a).toBe(0)
    expect(merge([{ a: 1 }], { a: 2 }).length).toBe(2)
    expect(merge([], [1]).length).toBe(1)
    expect(merge(null, [1]).length).toBe(1)
  })

  test('sleep', async () => {
    const f = jest.fn()
    await sleep(100).then(f)
    expect(f.mock.calls.length).toBe(1)
  })

  test('escape', () => {
    expect(escape('<div>"\'&')).toBe('&lt;div&gt;&quot;&#39;&amp;')
    expect(escape('')).toBe('')
  })

  test('diff string word', () => {
    const str1 = 'hello test'
    const str2 = 'test find'
    const { D, A } = diffWord(str1.split(' '), str2.split(' '))
    expect(D).toEqual(['hello'])
    expect(A).toEqual(['find'])
  })

  test('deep map', () => {
    const o = deepObjectMap(
      {
        a: 1,
        b: {
          c: 'b.c',
        },
      },
      (target) => {
        return target.a === 1
      }
    )
    expect(o.a).toEqual(1)
  })

  test('deep object key', () => {
    let a = 1
    deepObjectMap(
      {
        a: 1,
        children: [
          {
            a: 2,
            children: [
              {
                a: 3,
              },
            ],
          },
        ],
      },
      (target) => {
        expect(target.a).toBe(a++)
      },
      'children'
    )
  })

  test('deep array object', () => {
    const o = deepArrayFind(
      [{ a: [{ a: [{ a: 10, b: 1 }] }] }, { a: [] }, { a: 3 }],
      'a',
      (target) => target.a === 10
    )
    if (o) {
      expect((o as any).b).toBe(1)
    }
  })

  test('join uri', () => {
    expect(join(null)).toBe('')
    expect(join('a', 'b', 'c')).toBe('a/b/c')
    expect(join('a', '/b', 'c')).toBe('a/b/c')
    expect(join('a', '../b', 'c')).toBe('b/c')
    expect(join('./a', './b', '../c')).toBe('a/c')
  })

  test('resolve uri', () => {
    expect(resolve('a', '/b', 'c')).toBe('/b/c')
    expect(resolve('a', '../b', 'c')).toBe('/b/c')
  })

  test('isMap', () => {
    expect(isMap(new Map())).toBe(true)
    expect(isMap(new Set())).toBe(false)
  })

  test('isIntegerKey', () => {
    expect(isIntegerKey('0')).toBe(true)
    expect(isIntegerKey('-0')).toBe(false)
    expect(isIntegerKey('0.1')).toBe(false)
  })

  test('event', () => {
    expect(isEventProps('onClick')).toBe(true)
    expect(isEventProps('onclick')).toBe(false)
    expect(isEventProps('on')).toBe(false)
    expect(normalizeEventName('onClick')).toBe('click')
  })

  test('removeWithString', () => {
    expect(removeWithString('foo bar', ['bar'])).toBe('foo')
  })

  test('at', () => {
    const obj = { a: 1, b: { c: [0, 1] } }
    expect(at(obj, 'b.c[0]')).toBe(0)
    expect(at(obj, 'b.c[1]')).toBe(1)
    expect(at(obj, 'a')).toBe(1)
    expect(at(obj, 'c')).toBe(undefined)
  })
})
