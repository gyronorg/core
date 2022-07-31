import { transform } from './util'

describe('Setup', () => {
  test('render helper setup opt', () => {
    const file = `
    FC(function app({ value }) {
      return <span>{value}</span>
    })
  `
    const { code } = transform(file, true)
    expect(code).toContain(
      'return ({\n    value\n  }) => _h("span", {}, value)'
    )
  })

  test('render helper setup arrow function', () => {
    const file = `FC(({ value }) => {
      return <span>{value}</span>
    })`
    const { code } = transform(file, true)
    expect(code).toContain(
      'return ({\n    value\n  }) => _h("span", {}, value)'
    )
  })

  test('render helper setup arrow function(no block statement)', () => {
    const file = `FC(({ value }) => <span>{value}</span>)`
    const { code } = transform(file, true)
    expect(code).toContain('({\n  value\n}) => _h("span", {}, value)')
  })

  test('no path scope in component function', () => {
    const file = `
    FC(function app({ value }) {
      list.map(x => <a>{x}</a>)
      return <span>{value}</span>
    })
  `
    const { code } = transform(file, true)
    expect(code).toContain('list.map(x => _h("a", {}, x));')
  })
})
