import { PluginItem } from '@babel/core'
import { insertVisitor } from './visitor'
import syntaxJsx from '@babel/plugin-syntax-jsx'

export type { State } from './transformJsx'

export default (() => {
  return {
    name: 'babel-plugin-gyron-jsx',
    inherits: syntaxJsx,
    visitor: insertVisitor(),
  }
}) as PluginItem
