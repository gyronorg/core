import { FC, useReactive } from '@gyron/runtime'

export function ComponentA() {
  return <span>a</span>
}
export function ComponentB() {
  return <span>b</span>
}

export function Layout({ children, change }: any) {
  return (
    <div onClick={change} id="layout">
      {children}
    </div>
  )
}

export const View = FC(() => {
  const page = useReactive({
    count: 0,
  })
  const handleChange = () => {
    page.count++
  }
  const renderChild = () => {
    const e = Boolean(page.count % 2)
    return e ? <ComponentA /> : <ComponentB />
  }
  return () => <Layout change={handleChange}>{renderChild()}</Layout>
})
