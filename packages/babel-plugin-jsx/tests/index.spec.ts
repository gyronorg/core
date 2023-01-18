import { isFunction } from '@gyron/shared'
import { parse, transform } from '../src'
import { createVisitor, initialVisitor } from '../src/utils'
import { trim } from './util'

describe('JSX', () => {
  test('import h', () => {
    const file = 'function c() {return <br />}'
    const { code } = transform(file)
    expect(code).toContain('import { h as _h } from "gyron"')
  })
  test('transform jsx', () => {
    const file = `
      import { useValue } from '@gyron/runtime'

      function app() {
        const content = useValue(0)
        return <span>{content}</span>
      }
    `
    const { code } = transform(file)
    expect(code).toContain(`_h("span", {}, content)`)
    const importNames = ['h']
    importNames.forEach((name) => {
      expect(code).toContain(`${name} as _${name}`)
    })
  })

  test('transform props id', () => {
    const file = `const app = <div id="app"></div>`
    const { code } = transform(file)
    expect(trim(code)).toContain('{"id":"app"}')
  })

  test('transform event and props', () => {
    const file = `const app = <div id="app" onClick={()=>{}}></div>`
    const { code } = transform(file)
    expect(trim(code)).toContain('{"id":"app","onClick":()=>{}}')
  })

  test('transform Multiple', () => {
    const file = `
      import { useValue } from '@gyron/runtime'

      function app() {
        const content = useValue(0)
        return <div><span>{content.value}</span></div>
      }
    `
    const { code } = transform(file)
    expect(code).toContain(`_h("div", {}, _h("span", {}, content.value))`)
  })

  test('transform Multiple Children', () => {
    const file = `
      function app() {
        return <div><ul><li>1</li><li>2</li></ul></div>
      }
    `
    const { code } = transform(file)
    expect(code).toContain(
      '_h("ul", {}, [_h("li", {}, "1"), _h("li", {}, "2")])'
    )
  })

  test('example jsx map', () => {
    const file = `
    const app = () => (
      <span>
        {[1, 2, 3].map((x) => (
          <span>{x}</span>
        ))}
      </span>
    )`
    const { code } = transform(file)
    expect(code).toContain('[1, 2, 3].map(x => _h("span", {}, x)')
  })

  test('example jsx map (useValue)', () => {
    const file = `
    const list = useValue([])
    const app = () => (
      <span>
        {list.value.map((x) => (
          <span>{x}</span>
        ))}
      </span>
    )`
    const { code } = transform(file)
    expect(code).toContain('list.value.map(x => _h("span", {}, x)')
  })

  test('component Child Name Props', () => {
    const file = `
    const app = () => (
      <A w={0}></A>
    )`
    const { code } = transform(file)
    expect(code).toContain('_h(A,')
  })

  test('component Child MemberName Props', () => {
    const file = `
    const app = () => (
      <A.C w={0}></A.C>
    )`
    const { code } = transform(file)
    expect(code).toContain('_h(A.C,')
  })

  test('component Props Child', () => {
    const file = `
    const app = () => (
      <A><B>child</B></A>
    )`
    const { code } = transform(file)
    expect(code).toContain('_h(A, {}, _h(B, {}, "child"))')
  })

  test('unknown component name', () => {
    const file = `
    const app = () => <animateTransform />`
    const { code } = transform(file)
    expect(code).toContain('_h("animateTransform", {}, [])')
  })

  test('component JSXExpressionContainer', () => {
    const file = `const app = <div>{x ? 1: 2}</div>`
    const { code } = transform(file)
    expect(code).toContain('_h("div", {}, x ? 1 : 2)')
  })

  test('component Props isCustomComponent', () => {
    const file = `const app = <A onClick={""} />`
    const { code } = transform(file)
    expect(trim(code)).toContain('_h(A,{"onClick":""},[])')
  })

  test('component Children only', () => {
    const file = `const app = <A>
      <B />
    </A>`
    const { code } = transform(file)
    expect(trim(code)).toContain('_h(A,{},_h(B,{},[]))')
  })

  test('Fragment', () => {
    const file = `<>
      <A />
      <B />
    </>`
    const { code } = transform(file)
    expect(code).toContain('_h([_h(A, {}, []), _h(B, {}, [])])')
  })

  test('JSXSpreadAttribute', () => {
    const file = `<A a={1} {...{'a-b': 1}} />`
    const { code } = transform(file)
    expect(trim(code)).toContain(`_h(A,{"a":1,...{'a-b':1}},[])`)
  })

  test('JSX Attribute x-x', () => {
    const file = `<A data-aria="hidden"></A>`
    const { code } = transform(file)
    expect(code).toContain('"data-aria": "hidden"')
  })

  test('JSX Attribute boolean abbreviation', () => {
    const file = `<A single></A>`
    const { code } = transform(file)
    expect(code).toContain('"single": true')
  })

  test('merge visitor', () => {
    const enter = jest.fn()
    const visitors = createVisitor(
      initialVisitor(
        {
          JSX: {
            enter: enter,
          },
        },
        {
          JSX: {
            enter: enter,
          },
        }
      )
    )
    expect(!isFunction(visitors.JSX)).toBe(true)
    if (!isFunction(visitors.JSX)) {
      expect(typeof visitors.JSX.enter).toBe('function')
      visitors.JSX.enter.call(null, null, null)
      expect(enter).toHaveBeenCalledTimes(2)
    }
  })

  test('transition children must key', () => {
    const file = `<Transition><A /></Transition>`
    const { code } = transform(file)
    expect(code).toContain('"key": "0"')
  })

  test('transition merge children props', () => {
    const file = `<Transition><A key={1} /></Transition>`
    const { code } = transform(file)
    expect(code).toContain('"key": 1')
  })

  test('parse code by babel', () => {
    const ret = parse('const a;\nconst a')
    expect(ret.errors.length).toBe(3)
    expect(ret.errors[0].code).toBe('BABEL_PARSER_SYNTAX_ERROR')
  })
})
