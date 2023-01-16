import { PluginItem } from '@babel/core'
import { visitor } from './visitor'
import syntaxJsx from '@babel/plugin-syntax-jsx'

export type { State } from './transformJsx'

export const BabelDoJsx = {
  name: 'babel-plugin-gyron-jsx',
  inherits: syntaxJsx,
  visitor: visitor,
}

export default (() => {
  return BabelDoJsx
}) as PluginItem
