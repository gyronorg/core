import type { Component } from './component'
import { extend } from '@gyron/shared'
import { warn } from '@gyron/logger'
import { VNode } from './vnode'
import { ComponentSetupFunction, normalizeComponent } from './component'

const record: Map<string, Set<Component>> = /* #__PURE__ */ new Map()

export function refreshComponentType(
  vnode: VNode<ComponentSetupFunction>,
  component: Component
) {
  const hmrId = (vnode.type as any).__hmr_id
  const hmrComponent = record.get(hmrId)
  if (hmrComponent) {
    for (const comp of hmrComponent.values()) {
      comp.type = component.vnode.type
    }
    normalizeComponent(vnode, component)
  }
}

export function refreshRecord(id: string, component: Component) {
  const instances = record.get(id)
  if (instances) {
    instances.delete(component)
  }
}

export function collectHmrComponent(
  id: string,
  parent: string,
  component: Component
) {
  const instances = record.get(id)
  if (!instances) {
    record.set(id, new Set([component]))
  } else {
    instances.add(component)
  }
}

/**
 * Perform component hot update
 * @deprecated Only allowed for internal use, such as vite or other packaging tools
 */
export function rerender(id: string, type: ComponentSetupFunction) {
  const instances = record.get(id)
  if (instances) {
    for (const comp of instances.values()) {
      if (comp.destroyed) {
        instances.delete(comp)
        return void 0
      }
      comp.render = null
      normalizeComponent(extend(comp.vnode, { type }), comp)

      comp.update()
    }
  } else {
    if (__WARN__) {
      warn(
        'runtime',
        'An exception occurs during the hot update collection task, please submit issues to us at https://github.com/gyronorg/core',
        id,
        type
      )
    }
  }
}
