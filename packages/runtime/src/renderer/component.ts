import { isBoolean, isEqual, isPromise } from '@gyron/shared'
import { VNode, RenderElement } from '../vnode'
import {
  isCacheComponent,
  getCacheComponent,
  ComponentSetupFunction,
  Component,
  removeBuiltInProps,
  normalizeComponent,
  createComponentInstance,
  isAsyncComponent,
  renderComponent,
} from '../component'
import { patch } from '.'
import { SSRMessage } from '../ssr'
import { refreshComponentType, collectHmrComponent } from '../hmr'
import { setRef } from '../ref'
import {
  asyncTrackEffect,
  clearTrackEffect,
  createEffect,
} from '@gyron/reactivity'
import { JobPriority, pushQueueJob, SchedulerJob } from '../scheduler'
import { assertWarn } from '../assert'
import { hydrate } from '../hydrate'
import { invokeLifecycle } from '../lifecycle'

function shouldUpdate(result: any) {
  return !(isBoolean(result) && !result)
}

function patchSubTree(component: Component, prevTree: VNode, nextTree: VNode) {
  component.subTree = nextTree
  if (component.mounted) {
    const { anchor } = prevTree
    component.subTree.anchor = anchor
    patch(prevTree, nextTree, component.$parent, anchor, component)
    // onAfterUpdate
    invokeLifecycle(component, 'afterUpdates')
    component.$el = nextTree.el
  } else {
    // mount
    patch(null, nextTree, component.$parent, component.vnode.anchor, component)
    // after the render is complete, set el to the vnode for comparison
    // dummy ? <componentA /> : <componentB />
    component.vnode.el = nextTree.el
    component.$el = nextTree.el
    component.mounted = true
    // onAfterMount
    component.effect.allowEffect = true
    invokeLifecycle(component, 'afterMounts')
    component.effect.allowEffect = false
  }
}

function updateComponentEffect(
  component: Component,
  ssrMessage: SSRMessage = null
) {
  if (component.mounted) {
    // if the onBeforeUpdate callback function returns falsy
    // no update of the component is performed
    if (
      shouldUpdate(invokeLifecycle(component, 'beforeUpdates')) &&
      shouldUpdate(!component.props.static)
    ) {
      if (__DEV__) {
        refreshComponentType(component.vnode, component)
      }

      const prevTree = component.subTree
      const nextTree = renderComponent(component)
      if (isPromise(nextTree)) {
        assertWarn(
          'Asynchronous components without wrapping are not supported, please use FCA wrapping',
          component,
          'UpdateComponent'
        )
      } else {
        patchSubTree(component, prevTree, nextTree)
      }
    }
  } else if (!component.destroyed) {
    if (component.vnode.el) {
      function hydrateSubTree() {
        const nextTree = renderComponent(component)
        component.subTree = nextTree as VNode
        hydrate(component.vnode.el, component.subTree, component, ssrMessage)

        component.mounted = true
        // onAfterMount
        invokeLifecycle(component, 'afterMounts')
      }
      // asynchronous component rendering in ssr mode
      if (isAsyncComponent(component.vnode.type)) {
        component.vnode.type.__loader(component.props, component).then(() => {
          if (!component.destroyed) {
            asyncTrackEffect(component.effect)
            hydrateSubTree()
            clearTrackEffect()
          }
        })
      } else {
        hydrateSubTree()
      }
    } else {
      const nextTree = renderComponent(component)
      if (isPromise(nextTree)) {
        assertWarn(
          'Asynchronous components without wrapping are not supported, please use FCA wrapping',
          component,
          'SetupPatch'
        )
      } else {
        nextTree.transition ||= component.vnode.transition
        patchSubTree(component, null, nextTree)
      }
    }
  }
}

function updateComponent(component: Component) {
  if (component.update.priority === JobPriority.DEFERRED) {
    pushQueueJob(component.update)
  } else {
    component.update()
  }
}

function renderComponentEffect(
  component: Component,
  ssrMessage: SSRMessage = null
) {
  const effect = (component.effect = createEffect(
    updateComponentEffect.bind(null, component, ssrMessage),
    () => pushQueueJob(component.update)
  ))

  const update = (component.update = effect.run.bind(effect) as SchedulerJob)
  update.id = component.uid
  update.component = component
  update.priority = JobPriority.NORMAL
  update()
}

export function mountComponent(
  vnode: VNode<ComponentSetupFunction>,
  container: RenderElement,
  anchor: RenderElement,
  parentComponent: Component,
  ssrMessage: SSRMessage = null
) {
  vnode.anchor = anchor

  const component = (vnode.component = createComponentInstance(
    vnode,
    parentComponent
  ))
  component.$parent = container

  if (__DEV__ && (component.type as any).__hmr_id) {
    refreshComponentType(vnode, component)

    const parentId: string = parentComponent
      ? (parentComponent.type as any).__hmr_id
      : null
    collectHmrComponent((component.type as any).__hmr_id, parentId, component)
  }

  if (component.props.ref) {
    setRef(component.exposed, component.props.ref)
  }

  renderComponentEffect(component, ssrMessage)
}

export function patchComponent(
  n1: VNode<ComponentSetupFunction>,
  n2: VNode<ComponentSetupFunction>,
  container: RenderElement,
  anchor: RenderElement,
  parentComponent: Component
) {
  const component = (n2.component = n1.component)
  if (component) {
    normalizeComponent(n2, component, parentComponent)
    if (isCacheComponent(n1.component.type)) {
      if (!isEqual(n1.props, n2.props)) {
        updateComponent(component)
      }
    } else {
      updateComponent(component)
    }
  } else {
    if (__WARN__) {
      assertWarn('Component update exception', n1.component, 'PatchComponent')
    }
    mountComponent(n2, container, anchor, parentComponent)
  }
}

export function enterComponent(
  n1: VNode<ComponentSetupFunction> | null,
  n2: VNode<ComponentSetupFunction>,
  container: RenderElement,
  anchor: RenderElement,
  parentComponent: Component
) {
  if (n1 === null) {
    // clear the element of the next vnode to prevent access to the SSR hydrate logic.
    n2.el = null
    if (isCacheComponent(n2.type)) {
      // update the DOM with the locally cached component state when a local component cache is found
      const component = getCacheComponent(n2.type)
      component.destroyed = false
      component.mounted = true
      component.vnode = n2
      component.$parent = container
      if (isEqual(removeBuiltInProps(component.props), n2.props)) {
        patch(null, component.subTree, container, anchor, parentComponent)
      } else {
        mountComponent(n2, container, anchor, parentComponent)
      }
    } else {
      mountComponent(n2, container, anchor, parentComponent)
    }
  } else {
    n2.anchor ||= n1.anchor
    patchComponent(n1, n2, container, anchor, parentComponent)
  }
}
