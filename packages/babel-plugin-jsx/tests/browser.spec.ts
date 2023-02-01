import { initialBabelBundle, transform } from '../src'

describe('browser code editor', () => {
  test('build bundle with browser', async () => {
    const build = await initialBabelBundle(null)
    const foo = `
      export const Foo = FC(() => {
        return <div>gyron</div>
      })
    `
    const app = `
      import { Foo } from './foo'
      export function App(): any {
        return <Foo />
      }
    `
    const bundle = await build(
      {
        loader: 'tsx',
        code: 'import { App } from "./app"\nApp()',
        name: 'app.tsx',
        external: [],
      },
      {
        sources: [
          {
            loader: 'tsx',
            code: app,
            name: 'app.tsx',
          },
          {
            loader: 'tsx',
            code: foo,
            name: 'foo.tsx',
          },
        ],
      }
    )
    expect(bundle.outputFiles[0].text).toContain('var Foo = FC')
    expect(bundle.outputFiles[0].text).toContain('function App()')
    expect(bundle.outputFiles[0].text).toContain(
      'import { h as _h2 } from "gyron"'
    )
  })

  test('replace source gyron to uri', () => {
    const file = `
      import { Foo } from './foo.js'
      function App() {
        return <Foo />
      }
    `
    const { code } = transform(file, null, {
      importSourceMap: {
        gyron: 'https://unpkg.com/gyron',
      },
    })
    expect(code).toContain('https://unpkg.com/gyron')
  })
})
