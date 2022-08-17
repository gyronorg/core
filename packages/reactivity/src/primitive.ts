import { useReactive, ReactiveFlags, toRaw } from './reactive'

export class Primitive<T = any> {
  private _value: { value: T }

  public [ReactiveFlags.IS_PRIMITIVE] = true

  constructor(value: T) {
    this._value = useReactive<{ value: T }>({
      value,
    })
  }

  get value() {
    return this._value.value
  }

  set value(v) {
    this._value.value = v
  }

  get [ReactiveFlags.RAW]() {
    return toRaw(this._value.value)
  }

  get [ReactiveFlags.RAW_VALUE]() {
    return toRaw(this._value)
  }
}

/**
 * 使用 value 属性让基本类型的数据变得可响应，其内部就是使用`useReactive`方法，然后使用 value 作为属性名代理。
 * ```js
 * import { useValue } from 'gyron'
 *
 * const original = useValue(0)
 * original.value === 0 // true
 * ```
 * @api reactivity
 * @param value 想要被代理的数据，可以是基本类型，比如数字或者布尔值。
 * @returns 一个被代理过的对象，使用`.value`进行访问。
 */
export function useValue<T = any>(value: T) {
  return new Primitive(value)
}
