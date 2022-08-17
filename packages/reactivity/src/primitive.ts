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
 * Using the `value` attribute to make basic type data responsive is done
 * internally using the `useReactive` method and then using `value` as a proxy for the attribute name.
 * ```js
 * import { useValue } from 'gyron'
 *
 * const original = useValue(0)
 * original.value === 0 // true
 * ```
 * @api reactivity
 * @param value The data that you want to be proxied can be a basic type, such as a number or a boolean.
 * @returns An object that has been proxied and is accessed using `.value`.
 */
export function useValue<T = any>(value: T) {
  return new Primitive(value)
}
