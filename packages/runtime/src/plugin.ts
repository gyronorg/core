import { createContext } from './instance'

export const plugins = createContext()

export interface Plugin<D extends object, E = any> {
  data: D
  extra?: E
  name?: string
}

/**
 * Return all registered plugins
 * ```js
 * import { getPlugins } from 'gyron'
 * const plugins = getPlugins()
 * ```
 * @api global
 * @returns Map
 */
export function getPlugins() {
  return plugins
}
