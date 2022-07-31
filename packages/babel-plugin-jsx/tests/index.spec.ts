import { transform, trim } from './util'

describe('JSX', () => {
  test('Transform', () => {
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

  test('Transform props id', () => {
    const file = `const app = <div id="app"></div>`
    const { code } = transform(file)
    expect(trim(code)).toContain('{"id":"app"}')
  })

  test('Transform event and props', () => {
    const file = `const app = <div id="app" onClick={()=>{}}></div>`
    const { code } = transform(file)
    expect(trim(code)).toContain('{"id":"app","onClick":()=>{}}')
  })

  test('Transform Multiple', () => {
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

  test('Transform Multiple Children', () => {
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

  test('Example jsx map', () => {
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

  test('Example jsx map (useValue)', () => {
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

  test('Component Child Name Props', () => {
    const file = `
    const app = () => (
      <A w={0}></A>
    )`
    const { code } = transform(file)
    expect(code).toContain('_h(A,')
  })

  test('Component Child MemberName Props', () => {
    const file = `
    const app = () => (
      <A.C w={0}></A.C>
    )`
    const { code } = transform(file)
    expect(code).toContain('_h(A.C,')
  })

  test('Component Props Child', () => {
    const file = `
    const app = () => (
      <A><B>child</B></A>
    )`
    const { code } = transform(file)
    expect(code).toContain('_h(A, {}, _h(B, {}, "child"))')
  })

  test('Component JSXExpressionContainer', () => {
    const file = `const app = <div>{x ? 1: 2}</div>`
    const { code } = transform(file)
    expect(code).toContain('_h("div", {}, x ? 1 : 2)')
  })

  test('Component Props isCustomComponent', () => {
    const file = `const app = <A onClick={""} />`
    const { code } = transform(file)
    expect(trim(code)).toContain('_h(A,{"onClick":""},[])')
  })

  test('Component Children only', () => {
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
})
