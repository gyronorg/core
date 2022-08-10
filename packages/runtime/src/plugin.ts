import { isUndefined } from '@gyron/shared'
import { createContext } from './instance'

export const plugins = createContext()

export interface Plugin<D extends object, E = any> {
  data: D
  extra?: E
  name?: string
}

export function usePlugin() {
  return plugins
}

export function createPlugin<D extends object, E = any>(option: Plugin<D, E>) {
  if (isUndefined(option.data)) {
    console.warn('invalid plugin data', option.data)
    return null
  }

  return option
}
