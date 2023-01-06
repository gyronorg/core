import type { Component } from 'packages/runtime/src/component'
import type { Lifecycle } from 'packages/runtime/src/lifecycle'

export type Noop = () => void

export function keys(o: any) {
  return isObject(o) ? Object.keys(o) : []
}

export function isUndefined(o: any): o is undefined {
  return typeof o === 'undefined'
}

export function isNull(o: any): o is null {
  return typeof o === 'object' && !o
}

export function isArray(o: any): o is any[] {
  return Array.isArray(o)
}

export function isSet(val: unknown): val is Set<any> {
  return Object.prototype.toString.call(val) === '[object Set]'
}

export function isMap(val: unknown): val is Map<any, any> {
  return Object.prototype.toString.call(val) === '[object Map]'
}

export function isCollection(val: unknown) {
  const type = Object.prototype.toString.call(val).slice(8, -1)
  return ['Map', 'Set', 'WeakMap', 'WeakSet'].includes(type)
}

export function isBoolean(o: any): o is boolean {
  return Object.prototype.toString.call(o) === '[object Boolean]'
}

export function isObjectPrototype(obj: any): obj is object {
  return Object.prototype.toString.call(obj) === '[object Object]'
}

export function isIntegerKey(key: unknown) {
  return (
    isString(key) &&
    key !== 'NaN' &&
    key[0] !== '-' &&
    '' + parseInt(key, 10) === key
  )
}

export function shouldValue(o: any) {
  if (isArray(o)) {
    return o.length > 0
  }
  return typeof o !== 'undefined' && o !== null
}

export function extend<
  T extends Record<string | symbol, any>,
  P extends (T | any)[] = (T | any)[]
>(...args: P): T {
  return Object.assign(args[0], ...args.slice(1))
}

export function isEmpty(o: object) {
  return isObject(o) && keys(o).length === 0
}

export function isObject(o: any): o is Record<any, any> {
  return o && typeof o === 'object'
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
export function noop() {}

export function isElement(o: any) {
  return o instanceof Node
}

export function isComment(node: Node): node is Comment {
  return node.nodeType === 8
}

export function isPromise<T = any>(f: any): f is Promise<T> {
  return isObject(f) && isFunction(f.then) && isFunction(f.catch)
}

export function isString(o: any): o is string {
  return typeof o === 'string'
}

export function isNumber(o: any): o is number {
  return typeof o === 'number'
}

export function isPlanObject(obj: any): obj is { [k: string]: any } {
  if (!isObjectPrototype(obj)) return false

  const ctor = obj.constructor
  if (!isFunction(ctor)) return false

  const prot = ctor.prototype
  if (!isObjectPrototype(prot)) return false

  if (hasOwn(prot, 'isPrototypeOf') === false) {
    return false
  }

  return true
}

export function isFunction(o: any): o is (...args: any) => any {
  return o && typeof o === 'function'
}

export function hasOwn(
  val: object,
  key: string | number | symbol
): key is keyof typeof val {
  return Object.prototype.hasOwnProperty.call(val, key)
}

export function hasChanged(value: any, oldValue: any): boolean {
  return !Object.is(value, oldValue)
}

export function defineWritable(obj: object, k: any, readonly?: boolean) {
  Object.defineProperty(obj, k, {
    configurable: true,
    writable: !readonly,
  })
}

export function objectReadonlyReducer(obj: any, readonly?: boolean) {
  for (const k in obj) {
    if (hasOwn(obj, k)) {
      const { configurable } = Object.getOwnPropertyDescriptor(obj, k)
      if (configurable) {
        const value = obj[k]
        defineWritable(obj, k, readonly)
        if (isPlanObject(value)) {
          objectReadonlyReducer(value, readonly)
        }
      }
    }
  }
}

export function readonly(obj: object) {
  objectReadonlyReducer(obj, true)
}

export function readwrite(obj: object) {
  objectReadonlyReducer(obj, false)
}

export function isReadonly(obj: object, k: any) {
  const descriptor = Object.getOwnPropertyDescriptor(obj, k)
  if (descriptor) {
    return !descriptor.writable
  }
  return false
}

export function deepObjectMap<T extends object, K extends keyof T>(
  targets: T,
  callback: (target: T) => void | boolean,
  key?: K
) {
  if (isObject(targets)) {
    if (isObjectPrototype(targets)) {
      const result = callback(targets)
      if (isBoolean(result) && result) {
        return targets
      }
    }
    if (hasOwn(targets, key)) {
      targets = targets[key]
    }
    for (const k in targets) {
      if (hasOwn(targets, k)) {
        const target = targets[k]
        if (isObject(target)) {
          deepObjectMap(target, callback, key)
        }
      }
    }
  }
}

export type ArrayItem<T extends readonly unknown[]> =
  T extends readonly (infer I)[] ? I : never

export function deepArrayFind<
  T extends { [k in S]: any }[],
  K extends ArrayItem<T>,
  S extends string
>(targets: T, key: S, callback: (target: K) => void | boolean): K | void {
  if (isArray(targets)) {
    for (const value of targets) {
      const result = callback(value as K)
      if (isBoolean(result) && result) {
        return value as K
      }
      if (value[key]) {
        deepArrayFind(value[key], key, callback)
      }
    }
  }
}

export function isEqual<T = any>(target: T, source: T, k?: string) {
  if (keys(target).length !== keys(source).length) {
    return false
  }
  for (const key in target) {
    if (key !== k) {
      const p1 = target[key]
      const p2 = source[key]
      if (isArray(p1) && isArray(p2)) {
        if (p1.length !== p2.length) {
          return false
        }
        for (let i = 0, len = p1.length; i < len; i++) {
          if (isObject(p1[i]) && isObject(p2[i])) {
            if (isEqual(p1[i], p2[i], k)) {
              return false
            }
          } else if (p1[i] !== p2[i]) {
            return false
          }
        }
        return true
      } else if (target[key] !== source[key]) {
        return false
      }
    }
  }
  return true
}

export function join(...urls: string[]) {
  let baseUrl = urls[0]
  if (!isString(baseUrl)) {
    return ''
  }
  if (baseUrl[0] === '.') {
    baseUrl = baseUrl.slice(2)
  }
  return urls
    .slice(1)
    .filter(isString)
    .reduce((prev, cur) => {
      while (cur[0] === '.' || cur[0] === '/') {
        if (cur.slice(0, 2) === '..') {
          prev = prev.split('/').slice(0, -1).join()
          // ../
          cur = cur.slice(3)
          if (prev === '') {
            return cur
          }
        } else if (cur[0] === '/') {
          // /
          cur = cur.slice(1)
        } else {
          // ./
          cur = cur.slice(2)
        }
      }
      if (cur.length) {
        prev = prev + '/' + cur
      }
      return prev
    }, baseUrl)
    .replace('//', '/')
}

export function resolve(...urls: string[]) {
  let result = []
  urls.filter(isString).forEach((url) => {
    if (url[0] === '/') {
      result = [url.slice(1)]
    } else {
      result.push(url)
    }
  })
  return ('/' + join(...result)).replace('//', '/')
}

export function omit<T extends object, K extends keyof T | (keyof T)[]>(
  o: T,
  k: K
): Omit<T, K extends Array<any> ? K[number] : K> {
  const target: any = {}
  for (const key in o) {
    if (isArray(k)) {
      if (!k.includes(key)) {
        target[key] = o[key]
      }
    } else {
      if ((k as keyof T) !== key) {
        target[key] = o[key]
      }
    }
  }
  return target
}

export function merge<T = any>(target: any, source?: any): T {
  if (shouldValue(source)) {
    if (isArray(target)) {
      if (isArray(source)) {
        target.push(...source)
      } else {
        target.push(source)
      }
    } else if (isPlanObject(target)) {
      extend(target, source || {})
    } else if (isUndefined(target) || isNull(target)) {
      target = source
    }
  }
  return target
}

export function sleep<T = any>(ms: number, value?: T): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(value)
    }, ms)
  })
}

export function sleepWithRequestFrame() {
  return new Promise((resolve) => {
    requestAnimationFrame(resolve)
  })
}

export function removeWithString(target: string, values: string[]) {
  return target
    .split(' ')
    .filter((item) => !values.includes(item))
    .join(' ')
}

export function escape(string: unknown) {
  const escapeRE = /["'&<>]/
  const str = String(string)
  const match = escapeRE.exec(str)

  if (!match) {
    return str
  }

  let html = ''
  let escaped: string
  let index: number
  let lastIndex = 0
  for (index = match.index; index < str.length; index++) {
    switch (str.charCodeAt(index)) {
      case 34: // "
        escaped = '&quot;'
        break
      case 38: // &
        escaped = '&amp;'
        break
      case 39: // '
        escaped = '&#39;'
        break
      case 60: // <
        escaped = '&lt;'
        break
      case 62: // >
        escaped = '&gt;'
        break
      default:
        continue
    }

    if (lastIndex !== index) {
      html += str.slice(lastIndex, index)
    }

    lastIndex = index + 1
    html += escaped
  }

  return lastIndex !== index ? html + str.slice(lastIndex, index) : html
}

export function diffWord(words: string[], newWords: string[]) {
  const kindDeleteWords: string[] = []
  const kindAddWords: string[] = []
  words.filter(Boolean).forEach((word) => {
    if (!newWords.includes(word)) {
      kindDeleteWords.push(word)
    }
  })
  newWords.filter(Boolean).forEach((word) => {
    if (!words.includes(word)) {
      kindAddWords.push(word)
    }
  })
  return {
    D: kindDeleteWords,
    A: kindAddWords,
  }
}

export function isEventProps(name: string) {
  return /^on[A-Z]/.test(name)
}

export function normalizeEventName(name: string) {
  return name.slice(2).toLocaleLowerCase()
}

export function initialLifecycle(component: Component, key: keyof Lifecycle) {
  if (!component.lifecycle) {
    component.lifecycle = {
      [key]: new Set(),
    }
  }
  if (!component.lifecycle[key]) {
    component.lifecycle[key] = new Set()
  }
}
