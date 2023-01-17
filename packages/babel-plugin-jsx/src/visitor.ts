import { createVisitor, initialVisitor } from './utils'
import { Visitor } from '@babel/core'
import transformHmr from './hmr'
import transformImport from './import'
import transformJsx, { State } from './transformJsx'
import transformSetup from './setup'
import transformProps from './destructuring'
import transformSSR from './ssr'
import transformTransition from './transition'
import transformBrowser from './browser'

export function insertVisitor(visitor?: Visitor<State>) {
  return createVisitor(
    initialVisitor(
      transformImport,
      transformJsx,
      transformHmr,
      transformSetup,
      transformProps,
      transformSSR,
      transformTransition,
      transformBrowser,
      visitor
    )
  )
}

export const visitor = insertVisitor()
