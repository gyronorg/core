import { transformAsync } from '@babel/core'
import { Plugin } from 'esbuild'
import { Plugin as VitePlugin } from 'vite'
import { Options } from './transformJsx'
import babelJsx from './core'
import path from 'path'
import fs from 'fs'

export function babelESBuildJsx(options: Partial<Options> = {}): Plugin {
  return {
    name: 'esbuild:gyron-jsx',
    setup(build) {
      build.onLoad({ filter: /\.(t|j)sx$/ }, async (args) => {
        const source = await fs.promises.readFile(args.path, 'utf8')
        const filename = path.relative(process.cwd(), args.path)

        try {
          const plugins = [[babelJsx, options]]
          if (filename.endsWith('.tsx')) {
            plugins.push([
              require('@babel/plugin-transform-typescript'),
              { isTSX: true, allowExtensions: true },
            ])
          }
          const result = await transformAsync(source, {
            babelrc: false,
            ast: true,
            plugins,
            sourceMaps: true,
            sourceFileName: filename,
            filename: filename,
            configFile: false,
          })
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
    async transform(code, id) {
      const plugins = [[babelJsx, options]]
      if (id.endsWith('.tsx')) {
        plugins.push([
          require('@babel/plugin-transform-typescript'),
          { isTSX: true, allowExtensions: true },
        ])
      }
      if (/\.(t|j)sx$/.test(id)) {
        const result = await transformAsync(code, {
          babelrc: false,
          ast: true,
          plugins,
          sourceMaps: true,
          sourceFileName: id,
          filename: id,
          configFile: false,
        })

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
