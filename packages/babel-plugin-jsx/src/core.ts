import { PluginItem } from '@babel/core'
import { createVisitor, initialVisitor } from './utils'
import syntaxJsx from '@babel/plugin-syntax-jsx'
import transformHmr from './hmr'
import transformImport from './import'
import transformJsx from './transformJsx'
import transformSetup from './setup'
import transformProps from './destructuring'
import transformSSR from './ssr'

export type { State } from './transformJsx'

export const visitor = createVisitor(
  initialVisitor(
    transformImport,
    transformJsx,
    transformHmr,
    transformSetup,
    transformProps,
    transformSSR
  )
)

export const BabelDoJsx = {
  name: 'babel-plugin-gyron-jsx',
  inherits: syntaxJsx,
  visitor: visitor,
}

export default (() => {
  return BabelDoJsx
}) as PluginItem
