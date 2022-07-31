import { FC, isVNodeComponent, VNode } from '@gyron/runtime'
import { To } from 'history'

export interface RedirectProps {
  path: To
  redirect: To
}

export const Redirect = FC<RedirectProps>(function Redirect({ children }) {
  // Redirect component does not participate in the real node rendering, Route only provides props to Routes as the basis for Record
  // The real situation is that the render of Routes is responsible for node rendering.
  return children
})

export function isRedirect(vnode: VNode) {
  return isVNodeComponent(vnode) && vnode.type === Redirect
}
