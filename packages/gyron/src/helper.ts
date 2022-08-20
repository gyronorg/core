/**
 * The Babel Team (https://babel.dev/team)
 * Link (linkorgs@163.com)
 * import by "@babel/helpers" v7.18.6
 * The functions exported here are used to do tree shaking when building helper code
 */

export function objectWithoutPropertiesLoose(
  source: object,
  excluded: string[]
) {
  if (source == null) return {}

  const target = {}
  const sourceKeys = Object.keys(source)
  let key: string, i: number

  for (i = 0; i < sourceKeys.length; i++) {
    key = sourceKeys[i]
    if (excluded.indexOf(key) >= 0) continue
    target[key] = source[key]
  }

  return target
}

export function toPrimitive(input: any, hint: string) {
  if (typeof input !== 'object' || input === null) return input
  const prim = input[Symbol.toPrimitive]
  if (prim !== undefined) {
    const res = prim.call(input, hint || 'default')
    if (typeof res !== 'object') return res
    throw new TypeError('@@toPrimitive must return a primitive value.')
  }
  return (hint === 'string' ? String : Number)(input)
}

export function toPropertyKey(arg: any) {
  const key = toPrimitive(arg, 'string')
  return typeof key === 'symbol' ? key : String(key)
}

export function objectDestructuringEmpty(obj: any) {
  if (obj == null) throw new TypeError('Cannot destructure undefined')
}
