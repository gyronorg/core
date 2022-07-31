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

export function useValue<T = any>(value: T) {
  return new Primitive(value)
}
