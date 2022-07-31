import { createInstance, nextRender } from '@gyron/runtime'
import { trim } from './util'
import { View } from './view'

test('project magic', async () => {
  const container = document.createElement('div')
  createInstance(<View />).render(container)
  expect(trim(container.innerHTML)).toBe('<divid="layout"><span>b</span></div>')
  const layout = container.querySelector('#layout') as HTMLDivElement
  layout.click()
  await nextRender()
  expect(trim(container.innerHTML)).toBe('<divid="layout"><span>a</span></div>')
})
