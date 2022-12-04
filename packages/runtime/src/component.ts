import {
  useReactive,
  useEffect,
  Dependency,
  Effect,
  EffectFunction,
} from '@gyron/reactivity'
import {
  extend,
  isFunction,
  isObject,
  isPromise,
  isUndefined,
  omit,
} from '@gyron/shared'
import {
  createVNodeComment,
  VNode,
  VNodeType,
  normalizeVNode,
  RenderElement,
  VNodeProps,
  cloneVNode,
  VNodeChildren,
} from './vnode'
import { SchedulerJob } from './scheduler'
import { invokeLifecycle, Lifecycle, onDestroyed } from './lifecycle'
import { error, warn } from './assert'
import { UserRef } from './ref'

export type UtilComponentProps<T extends VNodeType, D = never> = T extends
  | ComponentFunction<infer Props>
  | ComponentSetupFunction<infer Props>
  ? Props & Omit<ComponentDefaultProps, 'isSSR'>
  : D

export type ComponentDefaultProps = Partial<{
  readonly isSSR: boolean
  readonly children: VNodeChildren
  readonly key: string | number | symbol
  readonly ref: UserRef
  // Used in loop nodes to determine if updates to props occur and thus decide whether to skip updates to child nodes.
  readonly memo: any[]
  // The user can optionally mark a node as static and all subsequent updates will skip the marked node.
  readonly static: boolean
  // Used for server-side rendering and client-side rendering to render text as real nodes.
  readonly html: string
}>

export type ComponentFunction<Props> = (
  props?: Props & ComponentDefaultProps
) => VNodeChildren

export interface ComponentSetupFunction<Props extends object = object> {
  (props: Props & ComponentDefaultProps, component: Component<Props>):
    | (VNodeChildren | Promise<VNodeChildren>)
    | ComponentFunction<Props>
  __cache?: boolean
  __cacheIndex?: number
  __ssr_uri?: string
  __hmr_id?: string
  [k: string]: any
}

export type AsyncComponentFunction<Props extends object = object> = (
  props: AsyncProps<Props>
) => Promise<ComponentSetupFunction<Props> | VNode>

type AsyncProps<Props> = Props & ComponentDefaultProps & { fallback?: VNode }

type AsyncComponentFunctionReturn<Props extends object = object> = {
  (): Promise<VNode>
  readonly __loader: (
    props: AsyncProps<Props>,
    component: Component
  ) => Promise<VNode<VNodeType>>
}

export type WrapperFunction<Props extends object> = {
  (
    props: Omit<Props, keyof ComponentDefaultProps>,
    component: Component<Props>
  ): VNode
}

export type Exposed = Record<string | number, any>

export interface Component<T extends object = object> {
  uid: number
  mounted: boolean
  destroyed: boolean
  parent: Component
  subTree: VNode
  vnode: VNode<ComponentSetupFunction>
  type: ComponentSetupFunction
  effect: Effect
  update: SchedulerJob
  render: ComponentFunction<T>
  setup: ComponentSetupFunction
  props: T & ComponentDefaultProps
  prevProps: T & ComponentDefaultProps
  ctx: Record<string | symbol, unknown>
  lifecycle: Lifecycle
  exposed: Exposed
  $el: RenderElement
  $parent: RenderElement
}

let uid = 0
let _component: Component

export function createComponentInstance(
  vnode: VNode<ComponentSetupFunction>,
  parentComponent: Component | null
): Component {
  const component: Component = {
    uid: uid++,
    type: vnode.type,
    parent: null,
    vnode: null,
    ctx: {},
    mounted: false,
    destroyed: false,
    subTree: null,
    effect: null,
    update: null,
    render: null,
    setup: null,
    props: null,
    prevProps: null,
    lifecycle: null,
    exposed: null,
    $el: null,
    $parent: null,
  }
  normalizeComponent(vnode, component, parentComponent)
  return component
}

/**
 * Get the current component object, but do not change or delete the values in it, as unintended errors may occur.
 * ```js
 * import { h, getCurrentComponent } from 'gyron'
 *
 * const App = h(() => {
 *   const component = getCurrentComponent()
 *   return h('div', 'hello world')
 * })
 * ```
 * @api component
 * @returns Component
 */
export function getCurrentComponent() {
  if (!_component) {
    warn(
      'Failed to get component instance, please submit issues to us at https://github.com/gyronorg/core',
      null,
      'getCurrentComponent'
    )
  }
  return _component
}

export function forceUpdate(component: Component) {
  component.update()
}

function renderComponentSubTree(
  component: Component,
  props: VNodeProps,
  renderTree: ReturnType<ComponentSetupFunction<VNodeProps>>
) {
  if (isFunction(renderTree)) {
    component.render = renderTree as ComponentFunction<VNodeProps>
    renderTree = callWithErrorHandling(
      renderTree,
      component,
      ErrorHandlingType.Setup,
      [props, component]
    )
  }
  if (isPromise(renderTree)) {
    return renderTree.then((subTree: VNodeChildren) => {
      subTree = normalizeVNode(subTree)
      subTree.parent = component.vnode
      return subTree
    })
  }

  const subTree = normalizeVNode(renderTree)
  subTree.parent = component.vnode
  return subTree
}

export function renderComponent(component: Component, isSSR = false) {
  const { render, setup } = component

  const renderFunction = render || setup

  // getCurrentComponent fn return current
  _component = component
  const props = normalizeComponentProps(component, isSSR)
  const renderTree: ReturnType<ComponentSetupFunction<VNodeProps>> =
    callWithErrorHandling(
      renderFunction,
      component,
      render ? ErrorHandlingType.Render : ErrorHandlingType.Setup,
      [props, component]
    )
  _component = null

  if (!component.mounted) {
    // onBeforeMount
    invokeLifecycle(component, 'beforeMounts')
  }

  return renderComponentSubTree(component, props, renderTree)
}

/**
 * The defineProps method cannot declare its return value using the deconstruction syntax
 *
 * correct code:
 * ```js
 * const props = defineProps()
 * props.foo
 * ```
 *
 * ~~incorrect code:~~
 * ```js
 * const { foo } = defineProps()
 * ```
 * @api component
 */
export function defineProps<
  T extends object,
  R extends object = T & ComponentDefaultProps
>(defaultValue?: object) {
  const component = getCurrentComponent()
  if (isObject(defaultValue)) {
    const props = extend({}, component.props)
    for (const key in defaultValue) {
      if (isUndefined(component.props[key])) {
        props[key] = defaultValue[key]
      }
    }
    return props as R
  }
  return component.props as R
}

/**
 * Exposes the data in the component for use by the parent component.
 * ```js
 * import { h, useValue, createRef, exposeComponent } from 'gyron'
 *
 * const Child = h(() => {
 *   const name = useValue('foo')
 *
 *   exposeComponent({ name })
 *
 *   return h('div', null, name.value)
 * })
 *
 * const App = h(() => {
 *   const ref = createRef()
 *
 *   ref.current // {name: {value: 'foo'}}
 *
 *   return h(Child, { ref })
 * })
 * ```
 * @line 14
 * @api component
 * @param exposed object
 */
export function exposeComponent(exposed: Record<string | number, any>) {
  const component = getCurrentComponent()
  extend(component.exposed, exposed)
}

/**
 * Component wrapper for the useEffect method, which automatically destroys the current effect dependency when the component is destroyed
 *
 * ```js
 * useWatch(() => {
 *  if (loading.value) {
 *    console.log('loading')
 *  }
 * })
 * ```
 *
 * Or you can use the second argument to automatically load a dependency that you don't need to use in the function, but pass the second argument if you need to make changes based on the dependency.
 *
 * ```js
 * useWatch(() => {
 *  if (loading.value) {
 *    console.log('loading')
 *  }
 * }, [() => changed.value])
 * ```
 * @api component
 */
export function useWatch<T = any>(
  watcher: EffectFunction<T>,
  dependency?: Dependency[]
) {
  const { effect } = useEffect(watcher, dependency)
  onDestroyed(() => effect.stop())
}

export function isAsyncComponent(
  componentFunction: any
): componentFunction is AsyncComponentFunctionReturn {
  return componentFunction ? isFunction(componentFunction.__loader) : false
}

/**
 * Wrapping functions for asynchronous components, providing fallback solutions,
 * support for scenarios such as asynchronous import of packaging tools.
 * ```ts
 * import { FCA } from 'gyron'
 *
 * interface Props {
 *   count: number
 * }
 *
 * const Child = FCA<Props>(() => import('./Son'))
 *
 * export const App = FC(() => {
 *   return <Child fallback={<span>loading...</span>} count={1} />
 * })
 *```
 * @api component
 * @param componentAsyncFunction function
 * @returns function
 */
export function FCA<
  Props extends object = object,
  T extends AsyncComponentFunction<Props> = AsyncComponentFunction<Props>
>(componentAsyncFunction: T) {
  let resolveComp: VNode
  let setup: ComponentFunction<Props>
  let loadedRet = false

  const state = useReactive({
    loaded: false,
  })

  const load = (props: AsyncProps<Props>, component: Component) => {
    _component = component
    return componentAsyncFunction(props)
      .then((value) => {
        loadedRet = true
        const subtree = ((value as { default?: ComponentFunction<Props> })
          .default || value) as ComponentFunction<Props>
        if (isFunction(subtree)) {
          setup = subtree
          resolveComp = normalizeVNode(subtree(props))
        } else {
          resolveComp = normalizeVNode(subtree as VNode)
          if (__DEV__ && __WARN__) {
            console.warn(
              'Async components are recommended to return a function that updates local state.\n' +
                'It is different from normal components, normal components are called again, ' +
                'while asynchronous components are called only once'
            )
          }
        }
        return resolveComp
      })
      .catch((e) => {
        error(e, component, 'AsyncComponent')
        return createVNodeComment('AsyncComponentError')
      })
  }

  const ret = function AsyncComponentWrapper() {
    const props = defineProps<AsyncProps<Props>>()

    if (props.isSSR) {
      // used during server-side rendering
      // where you need to wait for the asynchronous function to complete and return the html stream to the browser
      return load(props, _component)
    }

    if (!loadedRet) {
      load(props, _component).then(() => {
        state.loaded = true
      })
    } else {
      state.loaded = true
    }

    exposeComponent({
      state: state,
      __loader: load,
    })

    return function AsyncComponentWrapperSetup() {
      return state.loaded && resolveComp
        ? setup
          ? setup(props)
          : cloneVNode(resolveComp)
        : props.fallback || createVNodeComment('AsyncComponentWrapper')
    }
  }

  ret.__loader = load

  return ret as unknown as WrapperFunction<AsyncProps<Props>>
}

/**
 * Define a component that is primarily used for type derivation in typescript
 * ```ts
 * import { FC } from 'gyron'
 * interface Props {
 *   count: number
 * }
 *
 * const Child = FC<Props>(() => {
 *   return ({ count }) => <span>{count}</span>
 * })
 *
 * export const App = FC(() => {
 *   return <Child count={1} />
 * })
 * ```
 * @api component
 * @param componentFunction function
 * @returns function
 */
export function FC<
  Props extends object = object,
  T extends ComponentSetupFunction<Props> = ComponentSetupFunction<Props>
>(componentFunction: T) {
  return componentFunction as WrapperFunction<Props>
}

/**
 * Create a cache component, and memo will automatically call the FC method to ensure that the component type can be correctly inferred
 */
const cacheMemoComponent = new Map<ComponentSetupFunction, Component>()
let cacheIndex = 0

export function getCacheComponent(componentFunction: ComponentSetupFunction) {
  return cacheMemoComponent.get(componentFunction)
}

export function collectCacheComponent(
  componentFunction: ComponentSetupFunction,
  component: Component
) {
  cacheMemoComponent.set(componentFunction, component)
}

export function isCacheComponent(componentFunction: ComponentSetupFunction) {
  return cacheMemoComponent.has(componentFunction)
}

/**
 * Pass in the component function to clear the component cache.
 * ```js
 * import { h, keepComponent, clearCacheComponent } from 'gyron'
 *
 * const App = keepComponent(() => {
 *   return h('div')
 * })
 *
 * clearCacheComponent(App)
 * ```
 * @api component
 * @line 7
 * @param componentFunction function
 */
export function clearCacheComponent(componentFunction: ComponentSetupFunction) {
  if (isCacheComponent(componentFunction)) {
    const component = cacheMemoComponent.get(componentFunction)
    component.effect.stop()
    cacheMemoComponent.delete(componentFunction)
  }
}

/**
 * A cached component is created and the state of the component can be retained at all times.
 * The component cache can be cleared using `clearCacheComponent`.
 * ```javascript
 * import { h, keepComponent } from 'gyron'
 *
 * const App = keepComponent(() => {
 *   return h('div')
 * })
 * ```
 * @api component
 * @param componentFunction function
 * @returns function
 */
export function keepComponent<
  Props extends object = object,
  T extends ComponentSetupFunction<Props> = ComponentSetupFunction<Props>
>(componentFunction: T) {
  // TODO LRU
  // if (cacheMemoComponent.size > 0x20) {
  //   const f = cacheMemoComponent.keys()
  //   for (const fc of f) {
  //     if (cacheMemoComponent.size - 0x20 > fc.__cacheIndex) {
  //       clearCacheComponent(fc)
  //     }
  //   }
  // }
  componentFunction.__cache = true
  componentFunction.__cacheIndex = cacheIndex++
  return componentFunction as WrapperFunction<Props>
}

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

  if (!type) {
    console.warn('Failed to format component, "type" not found. node: ', vnode)
    return
  }

  let setup: ComponentSetupFunction
  if (isFunction(type)) {
    setup = type
  }

  if (!component.props) {
    component.props = {}
  }

  component.prevProps = extend({}, component.props)
  component.props = extend(component.props, vnode.props, {
    children: vnode.children,
  })
  component.exposed = component.exposed || {}
  component.vnode = vnode
  component.parent = parentComponent || component.parent
  component.setup = setup || component.setup
  component.type = type

  if (type.__cache && !isCacheComponent(type)) {
    collectCacheComponent(type, component)
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
  const propsClone: ComponentDefaultProps = extend({}, props)
  return omit(propsClone, ['isSSR', 'children', 'ref', 'key', 'memo', 'static'])
}
