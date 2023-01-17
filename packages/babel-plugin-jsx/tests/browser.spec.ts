import { transform } from '../src'

describe('browser code editor', () => {
  test('transform', () => {
    const foo = `
      export const Foo = FC(() => {
        return <div></div>
      })
    `
    const file = `
      import { Foo } from './foo.js'
      function App() {
        return <Foo />
      }
    `
    const { code } = transform(file, null, {
      transformLocalImportHelper(path) {
        return {
          code: path.node.source.value === './foo.js' ? foo : '',
          shouldTransform: true,
        }
      },
    })
    expect(code).toContain('const Foo = FC')
    expect(code).toContain(
      '/* The import statement has been parsed and the bundle has been executed. source: ./foo.js */'
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
