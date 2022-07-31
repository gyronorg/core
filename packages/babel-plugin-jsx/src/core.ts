import { PluginItem, Visitor } from '@babel/core'
import { merge } from 'lodash-es'
import syntaxJsx from '@babel/plugin-syntax-jsx'
import transformHmr from './hmr'
import transformImport from './import'
import transformJsx from './transformJsx'
import transformSetup from './setup'
import * as t from '@babel/types'

export type { State } from './transformJsx'

export const visitor: Visitor<t.Node> = merge(
  transformImport,
  transformJsx,
  transformHmr,
  transformSetup
)

export const BabelDoJsx = {
  name: 'babel-plugin-gyron-jsx',
  inherits: syntaxJsx,
  visitor: visitor,
}

export default (() => {
  return BabelDoJsx
}) as PluginItem
