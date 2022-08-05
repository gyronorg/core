import {
  useReactive,
  useEffect,
  Dependency,
  Effect,
  EffectFunction,
} from '@gyron/reactivity'
import { extend, isFunction, isPromise } from '@gyron/shared'
import {
  createComment,
  VNode,
  VNodeType,
  normalizeVNode,
  RenderElement,
  VNodeProps,
  cloneVNode,
  VNodeChildren,
} from './vnode'
import {
  callWithErrorHandling,
  ErrorHandlingType,
  normalizeComponent,
  normalizeComponentProps,
} from './renderComponent'
import { SchedulerJob } from './scheduler'
import { invokeLifecycle, Lifecycle, onDestroyed } from './lifecycle'
import { error, warn } from './assert'
import { UserRef } from './ref'

export type UtilComponentProps<T extends VNodeType, D = never> = T extends
  | ComponentFunction<infer Props>
  | ComponentSetupFunction<infer Props>
  ? Props
  : D

export type UtilFunctionProps<T> = T extends (props: infer A) => infer C
  ? C extends (props: infer B) => any
    ? B & A
    : A
  : any

export type ComponentDefaultProps = {
  readonly isSSR: boolean
  readonly children: VNodeChildren
}

export type ComponentParentProps = {
  readonly key: string | number | symbol
  readonly ref: UserRef
}

export type ComponentFunction<Props> = (
  props?: Props & Partial<ComponentDefaultProps>
) => VNodeChildren

export interface ComponentSetupFunction<Props extends object = object> {
  (props: Props & Partial<ComponentDefaultProps>, component: Component<Props>):
    | ComponentFunctionReturn
    | ComponentFunction<Props>
  __cache?: boolean
  [k: string]: any
}

export type AsyncComponentFunction<Props extends object = object> = (
  props?: AsyncProps<Props> & Partial<ComponentDefaultProps>
) => Promise<ComponentSetupFunction<Props> | VNode>

type ComponentFunctionReturn = VNodeChildren | Promise<VNodeChildren>

type AsyncProps<Props> = Props &
  Partial<ComponentDefaultProps & { fallback: VNode }>

type AsyncComponentFunctionReturn<Props extends object = object> = {
  (): Promise<VNode>
  readonly __loader: (
    props: AsyncProps<Props>,
    component: Component
  ) => Promise<VNode<VNodeType>>
}

export type WrapperFunction<T, Props extends object> = {
  (
    props: Omit<UtilFunctionProps<T>, keyof ComponentDefaultProps>,
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
  props: T & Partial<ComponentDefaultProps & ComponentParentProps>
  oldProps: T & Partial<ComponentDefaultProps & ComponentParentProps>
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
    oldProps: null,
    lifecycle: null,
    exposed: null,
    $el: null,
    $parent: null,
  }
  normalizeComponent(vnode, component, parentComponent)
  return component
}

export function getCurrentComponent() {
  if (!_component) {
    warn(
      'Failed to get component instance, please submit issues to us at https://github.com/Linkontoask/gyron/issues',
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
    component.render = renderTree
    renderTree = callWithErrorHandling(
      renderTree,
      component,
      ErrorHandlingType.Setup,
      [props, component]
    ) as ComponentFunctionReturn
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
 */
export function defineProps<T extends object>() {
  const component = getCurrentComponent()
  return component.props as T & ComponentDefaultProps
}

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
        return createComment('AsyncComponentError')
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
        : props.fallback || createComment('AsyncComponentWrapper')
    }
  }

  ret.__loader = load

  return ret as unknown as WrapperFunction<T, Props>
}

export function FC<
  Props extends object = object,
  T extends ComponentSetupFunction<Props> = ComponentSetupFunction<Props>
>(componentFunction: T) {
  return componentFunction as WrapperFunction<T, Props>
}

/**
 * Create a cache component, and memo will automatically call the FC method to ensure that the component type can be correctly inferred
 */
export const cacheMemoComponent = new Map<ComponentSetupFunction, Component>()

export function isCacheComponent(componentFunction: ComponentSetupFunction) {
  return cacheMemoComponent.has(componentFunction)
}

export function clearCacheComponent(componentFunction: ComponentSetupFunction) {
  if (isCacheComponent(componentFunction)) {
    const component = cacheMemoComponent.get(componentFunction)
    component.effect.stop()
    cacheMemoComponent.delete(componentFunction)
  }
}

export function memo<
  Props extends object = object,
  T extends ComponentSetupFunction<Props> = ComponentSetupFunction<Props>
>(componentFunction: T) {
  componentFunction.__cache = true
  return componentFunction as WrapperFunction<T, Props>
}
