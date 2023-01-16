import { transform } from '../src'

test('ssr basic', () => {
  const file = `
    function app() {
      return <span>{content}</span>
    }
  `
  const { code } = transform(file)
  expect(code).toContain('app.__ssr_uri = "876f2fe4?name=app"')
})
