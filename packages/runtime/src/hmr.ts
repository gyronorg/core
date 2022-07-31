import { extend, isString } from '@gyron/shared'
import { VNode } from './vnode'
import { Component, ComponentSetupFunction } from './component'
import { normalizeComponent } from './renderComponent'

const record: Map<string, Component> = /* #__PURE__ */ new Map()
const dep: Map<string, Set<string>> = /* #__PURE__ */ new Map()

export function refreshComponentType(
  vnode: VNode<ComponentSetupFunction>,
  component: Component
) {
  const hmrId = (vnode.type as any).__hmr_id
  const hmrComponent = record.get(hmrId)
  if (hmrComponent) {
    vnode.type = hmrComponent.vnode.type
    normalizeComponent(vnode, component)
  }
}

export function collectHmrComponent(
  id: string,
  parent: string,
  component: Component
) {
  const instance = record.get(id)
  if (!instance) {
    record.set(id, component)
  } else {
    instance.type = component.type
    instance.setup = component.setup
  }
  if (isString(parent)) {
    const dependence = dep.get(id)
    if (dependence) {
      dependence.add(parent)
    } else {
      dep.set(id, new Set([parent]))
    }
  }
}

function rerenderParent(id: string) {
  const dependence = dep.get(id)
  if (dependence) {
    for (const parent of dependence.values()) {
      const instance = record.get(parent)
      if (instance && instance.type) {
        rerender(parent, instance.type as ComponentSetupFunction)
      }
    }
  }
}

/**
 * Perform component hot update
 * @deprecated Only allowed for internal use, such as vite or other packaging tools
 */
export function rerender(id: string, type: ComponentSetupFunction) {
  const instance = record.get(id)
  if (instance) {
    instance.setup = null
    normalizeComponent(extend(instance.vnode, { type }), instance)

    // update the information in the local snapshot
    record.set(id, instance)

    if (!instance.destroyed) {
      instance.update()
    }
    rerenderParent(id)
  } else {
    if (__WARN__) {
      console.warn(
        'An exception occurs during the hot update collection task, please submit issues to https://github.com/Linkontoask/gyron/issues',
        id,
        type
      )
    }
  }
}
