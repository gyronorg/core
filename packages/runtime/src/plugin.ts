import { isFunction, isUndefined } from '@gyron/shared'
import { createContext } from './instance'
import { Context } from './vnode'

export const plugins = createContext()

export interface Plugin<D extends object, E = any> {
  data?: D
  install?: (plugins: Context) => void
  type?: symbol
  extra?: E
  name?: string
}

export function createPlugin<D extends object, E = any>(option: Plugin<D, E>) {
  if (isUndefined(option.data) && !isFunction(option.install)) {
    console.warn('invalid plugin data', option.data)
    return null
  }

  if (isFunction(option.install)) {
    option.install(plugins)
  } else {
    plugins.set(option.type, option.data)
  }

  return option
}
