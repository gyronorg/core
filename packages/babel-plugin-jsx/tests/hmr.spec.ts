import { transform } from './util'

describe('HMR', () => {
  test('functionDeclaration insert hmr code', () => {
    const file = `
    function app() {
      return <span>{content}</span>
    }
  `
    const { code } = transform(file)
    expect(code).toContain('app.__hmr_id = "3abd7699"')
  })

  test('variableDeclarator insert hmr code', () => {
    const file = `
    const app = () => {
      return <span>{content}</span>
    }
    const home = function () {
      return <span>{content}</span>
    }
  `
    const { code } = transform(file)
    expect(code).toContain('app.__hmr_id = "030105f0"')
    expect(code).toContain('home.__hmr_id = "5d196250"')
    expect(code).toContain('// #__hmr_comp_name:app-030105f0')
    expect(code).toContain('// #__hmr_comp_name:home-5d196250')
  })

  test('callExpression name equal FC', () => {
    const file = `
    const app = FC(function () {
      return <span>{content}</span>
    })
  `
    const { code } = transform(file)
    expect(code).toContain('app.__hmr_id = "38442cac"')
  })

  test('exportDefaultDeclaration name', () => {
    let file = `
    export default FC(function () {
      return <span>{content}</span>
    })`
    let code = transform(file).code
    expect(code).toContain('const _default = FC(function () {')
    expect(code).toContain('export default _default;')
    expect(code).toContain('_default.__hmr_id = "35eb6e58"')
    file = `
    export default function app() {
      return <span>{content}</span>
    }`
    code = transform(file).code
    expect(code).toContain('_default.__hmr_id = "8788bb92"')
  })

  test('jsx element scope', () => {
    const file = `
    function app() {
      const foo = () => <div></div>
      return <span>{content}</span>
    }
  `
    const { code } = transform(file)
    expect(code).toContain(
      'foo.__hmr_id = "8d43f946";\n  return _h("span", {}, content)'
    )
  })

  test('nested jsx element', () => {
    const file = `
    function foo() {
      return <span><span>{content}</span></span>
    }
    function app() {
      return <span><span>{content}</span></span>
    }
  `
    const { code } = transform(file)
    const c1 = code.match(/app\.__hmr_id/g)
    const c2 = code.match(/foo\.__hmr_id/g)
    expect(Boolean(c1)).toBe(true)
    expect(c1.length).toBe(1)
    expect(Boolean(c2)).toBe(true)
    expect(c2.length).toBe(1)
  })
})
