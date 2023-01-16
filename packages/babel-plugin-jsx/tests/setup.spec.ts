import { transform } from '../src'
import { trim } from './util'

describe('Setup', () => {
  test('render helper setup opt', () => {
    const file = `
    FC(function app({ value }) {
      return <span>{value}</span>
    })
  `
    const { code } = transform(file)
    expect(code).toContain(
      'return ({\n    value\n  }) => _h("span", {}, value)'
    )
  })

  test('render helper setup arrow function', () => {
    const file = `FC(({ value }) => {
      return <span>{value}</span>
    })`
    const { code } = transform(file)
    expect(code).toContain(
      'return ({\n    value\n  }) => _h("span", {}, value)'
    )
  })

  test('render helper setup arrow function(no block statement)', () => {
    const file = `FC(({ value }) => <span>{value}</span>)`
    const { code } = transform(file)
    expect(code).toContain('({\n  value\n}) => _h("span", {}, value)')
  })

  test('no path scope in component function', () => {
    const file = `
    FC(function app({ value }) {
      list.map(x => <a>{x}</a>)
      return <span>{value}</span>
    })
  `
    const { code } = transform(file)
    expect(code).toContain('list.map(x => _h("a", {}, x));')
  })

  test('transform params to update expression', () => {
    const file = `
    FC(({ value }) => {
      return <span>{value}</span>
    })
  `
    const { code } = transform(file)
    expect(code).toContain(
      'import { onBeforeUpdate as _onBeforeUpdate } from "gyron"'
    )
    expect(code).toContain('// Auxiliary update of deconstructed props')
    expect(trim(code)).toContain(
      `_onBeforeUpdate((_,props)=>{var_props=props;value=_props.value;})`
    )
  })

  test('transfrom ArrayPattern', () => {
    const file = `
    FC(({ a: [value] }) => {
      return <span>{value}</span>
    })
  `
    const { code } = transform(file)
    expect(code).toContain('value = _props$a[0]')
  })

  test('transfrom ObjectPattern', () => {
    const file = `
    FC(({ a: { value } }) => {
      return <span>{value}</span>
    })
  `
    const { code } = transform(file)
    expect(code).toContain('value = _props.a.value')
  })

  test('transform ObjectPattern with ArrayPattern', () => {
    const file = `
    FC(({ a: { b: [value] } }) => {
      return <span>{value}</span>
    })
  `
    const { code } = transform(file)
    expect(code).toContain('value = _props$a$b[0]')
  })

  test('transform RestElement', () => {
    const file = `
    FC(({ a, ...rest }) => {
      return <span>{rest.value}</span>
    })
  `
    const { code } = transform(file)
    expect(code).toContain(
      'import { objectWithoutPropertiesLoose as _objectWithoutPropertiesLoose } from "gyron"'
    )
    expect(code).toContain('const _excluded = ["a"]')
    expect(code).toContain(
      'rest = _objectWithoutPropertiesLoose(_props, _excluded)'
    )
  })
})
