import type { Plugin, BuildOptions, Loader, OnLoadArgs } from 'esbuild'
import { Options } from './transformJsx'
import { last } from 'lodash-es'
import { transformWithBabel } from './plugin'

export interface ConfigSource extends Partial<Options> {
  code: string
  name: string
  loader: Loader
  external?: string[]
}

export interface Config {
  sources: ConfigSource[]
  options?: BuildOptions
}

const loaderMap = {
  less: 'css',
  sass: 'css',
}
function getFileName(args: OnLoadArgs, loader: Loader) {
  const source = last(args.path.split('/'))
  const suffix = last(source.split('.'))
  if (['tsx', 'ts', 'js', 'jsx', 'css', 'json'].includes(suffix)) {
    return source
  }
  return source + '.' + loader
}

function findSourceCode(sources: ConfigSource[], path: string) {
  let loader: Loader = path.match(/\.(js|jsx|ts|tsx|less|sass)$/)?.[1] as Loader
  loader = loaderMap[loader] || loader
  if (!loader) {
    loader = 'tsx'
  }

  const normalizedName = (name: string) =>
    name.replace(/^\.\//, '').replace(/\.(js|jsx|ts|tsx|less|sass)$/, '')

  if (loader === 'css') {
    path += '.ts'
  }

  const source = sources
    .filter((source) => source.loader === loader)
    .find((source) => normalizedName(source.name) === normalizedName(path))
  return source
}

export function buildBrowserEsmWithEsbuild(main: ConfigSource, config: Config) {
  const buildModuleRuntime: Plugin = {
    name: 'buildModuleRuntime',
    setup(build) {
      build.onResolve({ filter: /\.\// }, (args) => {
        return {
          path: args.path,
          namespace: 'localModule',
        }
      })
      build.onLoad(
        { filter: /\.\//, namespace: 'localModule' },
        async (args) => {
          const source = findSourceCode(config.sources, args.path)

          if (source) {
            const filename = getFileName(args, source.loader)
            const result = await transformWithBabel(
              source.code,
              filename,
              main,
              true
            )
            return {
              contents: result.code,
            }
          }
          return {
            contents: '',
            loader: 'text',
            warnings: [
              {
                pluginName: 'buildModuleRuntime',
                text: `Module "${args.path}" is not defined in the local editor`,
              },
            ],
          }
        }
      )
    },
  }

  return {
    plugin: buildModuleRuntime,
    main: main,
  }
}
