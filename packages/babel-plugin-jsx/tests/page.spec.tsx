import { FC, useReactive, createInstance, nextRender } from 'gyron'
import { trim } from './util'

function ComponentA() {
  return <span>a</span>
}
function ComponentB() {
  return <span>b</span>
}

function Layout({ children, change }: any) {
  return (
    <div onClick={change} id="layout">
      {children}
    </div>
  )
}

const View = FC(() => {
  const page = useReactive({
    count: 0,
  })
  const handleChange = () => {
    page.count++
  }
  const RenderChild = () => {
    const e = Boolean(page.count % 2)
    return e ? <ComponentA /> : <ComponentB />
  }
  return (
    <Layout change={handleChange}>
      <RenderChild />
    </Layout>
  )
})

test('project magic', async () => {
  const container = document.createElement('div')
  createInstance(<View />).render(container)
  expect(trim(container.innerHTML)).toBe('<divid="layout"><span>b</span></div>')
  const layout = container.querySelector('#layout') as HTMLDivElement
  layout.click()
  await nextRender()
  expect(trim(container.innerHTML)).toBe('<divid="layout"><span>a</span></div>')
})
