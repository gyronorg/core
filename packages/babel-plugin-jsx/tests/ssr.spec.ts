import { transform } from './util'

test('ssr basic', () => {
  const file = `
    function app() {
      return <span>{content}</span>
    }
  `
  const { code } = transform(file, true)
  expect(code).toContain('app.__ssr_uri = "876f2fe4"')
  expect(code).toContain('app.__ssr_name = "app"')
})
