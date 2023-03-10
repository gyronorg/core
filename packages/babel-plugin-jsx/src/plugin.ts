import { transformAsync } from '@babel/core'
import { Plugin } from 'esbuild'
import { Plugin as VitePlugin } from 'vite'
import { Options } from './transformJsx'
import type { LoaderDefinitionFunction } from 'webpack'
import babelJsx from './core'
import path from 'path'
import fs from 'fs'

export async function transformWithBabel(
  code: string,
  filename: string,
  options: Partial<Options>,
  onlyRemoveTypeImports = false
) {
  const plugins = [[babelJsx, options]]
  if (filename.endsWith('.tsx')) {
    plugins.push([
      require('@babel/plugin-transform-typescript'),
      {
        isTSX: true,
        allowExtensions: true,
        onlyRemoveTypeImports: onlyRemoveTypeImports,
      },
    ])
  }
  return transformAsync(code, {
    babelrc: false,
    ast: true,
    plugins,
    sourceMaps: true,
    sourceFileName: filename,
    filename: filename,
    configFile: false,
  })
}

const defaultOptions: Partial<Options> = {
  setup: true,
}

export function babelESBuildJsx(options: Partial<Options> = {}): Plugin {
  options = Object.assign({}, defaultOptions, options)
  return {
    name: 'esbuild:gyron-jsx',
    setup(build) {
      build.onLoad({ filter: /\.(t|j)sx$/ }, async (args) => {
        const source = await fs.promises.readFile(args.path, 'utf8')
        const filename = path.relative(process.cwd(), args.path)

        try {
          const result = await transformWithBabel(source, filename, options)
          return { contents: result.code }
        } catch (e) {
          return {
            errors: [
              {
                text: e.message,
              },
            ],
          }
        }
      })
    },
  }
}

export function babelViteJsx(options: Partial<Options> = {}): VitePlugin {
  options = Object.assign({}, defaultOptions, options)
  return {
    name: 'vite:gyron-jsx',
    config(config) {
      return {
        define: {
          __DEV__: config.mode === 'development',
          __WARN__: config.mode === 'development',
        },
        esbuild: {
          include: /\.ts$/,
          exclude: /node_modules/,
        },
        resolve: {
          alias: [
            {
              find: /@\/(.*)/,
              replacement: path.join(process.cwd(), './src/$1'),
            },
          ],
        },
      }
    },
    async transform(source, filename) {
      if (/\.(t|j)sx$/.test(filename)) {
        const result = await transformWithBabel(source, filename, options)

        if (options.hmr) {
          const componentHmr = [],
            comments = result.ast.program.trailingComments
          if (comments) {
            for (let i = 0; i < comments.length; i++) {
              const comment = comments[i].value
              if (comment.includes('#__hmr_comp_name')) {
                const comp = comment
                  .replace(/\s#__hmr_comp_name:/, '')
                  .split('-')
                componentHmr.push({
                  name: comp[0],
                  id: comp[1],
                })
              }
            }
          }

          if (componentHmr.length) {
            result.code = `\nimport { rerender } from 'gyron'\n` + result.code
            result.code += `\nimport.meta.hot.accept(({ ${componentHmr
              .map((comp) => comp.name)
              .join(', ')} }) => {
  try {
    ${componentHmr
      .map((comp) => `rerender(${comp.name}.__hmr_id, ${comp.name})`)
      .join(';\n    ')};
  } catch(e){
    import.meta.hot.invalidate();
  }
})`
          }
        }

        return {
          code: result.code,
          map: result.map,
        }
      }
    },
  }
}

export const babelWebpack: LoaderDefinitionFunction<Options> = async function (
  source: string
) {
  const options = this.getOptions()

  const result = await transformWithBabel(source, this.resourcePath, options)

  return result.code
}
