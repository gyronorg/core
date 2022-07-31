import { isFunction, extend, omit } from '@gyron/shared'
import {
  cacheMemoComponent,
  Component,
  ComponentDefaultProps,
  ComponentParentProps,
  ComponentSetupFunction,
} from './component'
import { VNode, VNodeProps } from './vnode'
import { error } from './assert'
import { initialLifecycle } from './lifecycle'

export enum ErrorHandlingType {
  Render = 'Render',
  Setup = 'Setup',
  Lifecycle = 'Lifecycle',
  Scheduler = 'Scheduler',
}

export function callWithErrorHandling(
  fn: (...args: any[]) => any | Promise<any>,
  instance: Component | null,
  type: ErrorHandlingType,
  args?: unknown[]
) {
  let res: any
  try {
    res = args ? fn(...args) : fn()
  } catch (err) {
    error(err, instance, type)
  }
  return res
}

export function normalizeComponent(
  vnode: VNode<ComponentSetupFunction>,
  component: Component,
  parentComponent?: Component
) {
  const { type } = vnode

  let setup: ComponentSetupFunction
  if (isFunction(type)) {
    setup = type
  }

  if (!component.props) {
    component.props = {}
  }

  component.oldProps = extend({}, component.props)
  component.props = extend(component.props, vnode.props, {
    children: vnode.children,
  })
  component.lifecycle = component.lifecycle || initialLifecycle()
  component.exposed = component.exposed || {}
  component.vnode = vnode
  component.parent = parentComponent || component.parent
  component.setup = setup || component.setup
  component.type = type

  if (type.__cache && !cacheMemoComponent.has(type)) {
    cacheMemoComponent.set(type, component)
  }
}

export function normalizeComponentProps(
  component: Component,
  isSSR: boolean
): VNodeProps {
  const builtinProps: ComponentDefaultProps = {
    children: component.vnode.children,
    isSSR: isSSR,
  }

  const props = extend<VNodeProps>(component.props, builtinProps)

  return props
}

export function removeBuiltInProps(props: Partial<VNodeProps>) {
  const propsClone: ComponentDefaultProps & ComponentParentProps = extend(
    {},
    props
  )
  return omit(propsClone, ['isSSR', 'children', 'ref', 'key'])
}
