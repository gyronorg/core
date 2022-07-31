import { VNode, FC, isVNodeComponent } from '@gyron/runtime'
import { To } from 'history'

export enum RouteFlag {
  Normal,
  Regexp,
  Redirect,
}

export interface RouteTransfer {
  regexpPath: string
  parentPath: string
  redirect: To
  params: object
  depth: number
  matchFromRedirect: boolean
  flag: RouteFlag
  root: RouteRecord
  children: RouteRecord[]
  matched: RouteRecord[]
}

export interface RouteRecordConfig extends Omit<RouteProps, 'children'> {
  redirect?: string
  children?: RouteRecordConfig[]
  meta?: object
}

export interface RouteRecordExtra extends RouteTransfer {
  element: VNode
  index: boolean
  name: string
  strict: boolean
  sensitive: boolean
}

export interface RouteRecord {
  path: To
  extra: Partial<RouteRecordExtra>
  meta?: any
}

export type RouteProps = Partial<
  Omit<RouteRecord, 'extra'> & Omit<RouteRecordExtra, keyof RouteTransfer>
>

export const Route = FC<RouteProps>(function Route({ element, children }) {
  // Route component does not participate in the real node rendering, Route only provides props to Routes as the basis for Record
  // The real situation is that the render of Routes is responsible for node rendering.
  return element || children
})

export function isRoute(vnode: VNode) {
  return isVNodeComponent(vnode) && vnode.type === Route
}
