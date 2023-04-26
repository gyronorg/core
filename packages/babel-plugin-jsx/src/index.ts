import babelJsx from './core'

export {
  // this method will no longer be supported in the future (createGyronESBuildPlugin)
  createGyronESBuildPlugin as babelESBuildJsx,
  // this method will no longer be supported in the future (createGyronVitePlugin)
  createGyronVitePlugin as babelViteJsx,
  createGyronESBuildPlugin,
  createGyronVitePlugin,
  createGyronWebpackLoader,
  transformWithBabel,
} from './plugin'
export { transform, ts2js } from './transform'
export { parse } from './parse'
export { insertVisitor } from './visitor'
export { buildBrowserEsmWithEsbuild } from './browser'

export default babelJsx
