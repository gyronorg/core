import { isFunction, isObject } from '@gyron/shared'
import { Instance } from './instance'

export const TypePlugin = Symbol.for('gyron.plugin')

function isPlugin(plugin: Plugin) {
  return isObject(plugin) && plugin.type === TypePlugin
}

export interface Plugin<E = any> {
  type: typeof TypePlugin
  install: (instance: Instance, isSSR: boolean) => void
  extra?: E
  name?: string | symbol
}

export type PluginOption<E> = Omit<Plugin<E>, 'type'>

export function createPlugin<E>(option: PluginOption<E>): Plugin<E> {
  if (!isFunction(option.install)) {
    console.warn('invalid plugin install', option.install)
    return null
  }
  return {
    install: option.install,
    extra: option.extra,
    type: TypePlugin,
  }
}

export function installPlugin(
  plugin: Plugin,
  instance: Instance,
  isSSR: boolean
) {
  if (!isPlugin(plugin)) {
    console.warn('invalid plugin error, please use createPlugin function.')
    return null
  }

  if (instance.plugins.has(plugin)) {
    return null
  }

  plugin.install(instance, isSSR)

  instance.plugins.add(plugin)
}
