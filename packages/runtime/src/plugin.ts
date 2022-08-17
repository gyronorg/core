import { createContext } from './instance'

export const plugins = createContext()

export interface Plugin<D extends object, E = any> {
  data: D
  extra?: E
  name?: string
}

/**
 * 返回所有已经注册的插件
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
