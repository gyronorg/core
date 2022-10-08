import {
  createComment,
  createElement,
  createText,
  insert,
  isSelectElement,
  mountProps,
  nextSibling,
  patchProps,
  remove,
} from '@gyron/dom-client'
import {
  asyncTrackEffect,
  clearTrackEffect,
  createEffect,
} from '@gyron/reactivity'
import {
  extend,
  isArray,
  isBoolean,
  isElement,
  isEqual,
  isFunction,
  isObject,
  isPromise,
  keys,
  shouldValue,
} from '@gyron/shared'
import { warn } from './assert'
import {
  Component,
  ComponentSetupFunction,
  createComponentInstance,
  getCacheComponent,
  isAsyncComponent,
  isCacheComponent,
  renderComponent,
  normalizeComponent,
  removeBuiltInProps,
} from './component'
import { collectHmrComponent, refreshComponentType } from './hmr'
import { hydrate } from './hydrate'
import { invokeLifecycle } from './lifecycle'
import { setRef } from './ref'
import { JobPriority, pushQueueJob, SchedulerJob } from './scheduler'
import { isVNode, isVNodeComponent } from './shared'
import { SSRMessage } from './ssr'
import {
  Children,
  Comment,
  Element,
  Fragment,
  mergeVNodeWith,
  normalizeChildrenVNode,
  normalizeVNode,
  RenderElement,
  Text,
  VNode,
} from './vnode'

function shouldUpdate(result: any) {
  return !(isBoolean(result) && !result)
}

function isSameVNodeType(n1: VNode, n2: VNode) {
  return n1.type === n2.type && n1.key === n2.key
}

function isKeyPatch(n1: VNode[], n2: VNode[]) {
  if (n1 && n2 && n1[0] && n2[0] && isObject(n1[0]) && isObject(n2[0])) {
    return shouldValue(n1[0].key) && shouldValue(n2[0].key)
  }
  return false
}

function getNextSibling(vnode: VNode) {
  if (vnode.component) {
    return getNextSibling(vnode.component.subTree)
  }
  if (vnode.anchor || vnode.el) {
    return nextSibling(vnode.anchor || vnode.el)
  }
  return null
}

function mountChildren(
  nodes: VNode[] | Children[],
  container: RenderElement,
  anchor: RenderElement,
  start = 0,
  parentComponent: Component | null = null,
  isSvg: boolean
) {
  for (let i = start; i < nodes.length; i++) {
    const node = normalizeVNode(nodes[i])
    nodes[i] = node
    patch(null, node, container, anchor, parentComponent, isSvg)
  }
}

export function unmount(vnode: VNode) {
  if (!isVNode(vnode)) {
    return null
  }

  const { el, component, children } = vnode

  if (component) {
    if (!isCacheComponent(component.type)) {
      component.effect.stop()
    }
    if (component.subTree) {
      unmount(component.subTree)
    }
    invokeLifecycle(component, 'destroyed')
    if (component.$el) {
      remove(component.$el as Element)
      if (!isCacheComponent(component.type)) {
        component.$el = null
      }
    }
    component.destroyed = true
    component.mounted = false
  } else {
    if (isArray(children) && children.length > 0) {
      unmountChildren(children as VNode[])
    } else {
      unmount(children as VNode)
    }
    if (isElement(el)) {
      remove(el as Element)
    }
  }
  vnode.el = null
}

function unmountChildren(c1: VNode[], start = 0) {
  for (let i = start; i < c1.length; i++) {
    unmount(c1[i])
  }
}

function patchNonKeyed(
  c1: VNode[],
  c2: VNode[],
  container: RenderElement,
  anchor: RenderElement,
  parentComponent: Component,
  isSvg: boolean
) {
  const c1length = c1.length
  const c2length = c2.length
  const minLength = Math.min(c1length, c2length)
  for (let i = 0; i < minLength; i++) {
    const prevChild = c1[i]
    const nextChild = c2[i]
    patch(prevChild, nextChild, container, anchor, parentComponent)
  }
  if (c1length > c2length) {
    unmountChildren(c1, minLength)
  } else {
    mountChildren(c2, container, anchor, minLength, parentComponent, isSvg)
  }
}

function patchKeyed(
  c1: VNode[],
  c2: VNode[],
  container: RenderElement,
  anchor: RenderElement | null,
  parentComponent: Component | null,
  isSvg: boolean
) {
  const o1: Record<
    string | symbol,
    VNode & { index: number; inserted: boolean }
  > = c1.reduce((nodeMap, node, index) => {
    nodeMap[node.key] = extend(node, { index })
    return nodeMap
  }, {})

  const e2 = c2.length
  let i = 0
  while (i < e2) {
    const c2n = c2[i]
    const c1n = o1[c2n.key]
    if (c1n) {
      // 1, find the same key value of the node, and then inserted into the corresponding location. (Do not delete add, move directly)
      const el = mergeVNodeWith(c2n, c1n).el
      if (c1n.index !== i) {
        // insert to new position when node order is changed
        const anchor = container.childNodes[i]
        if (el !== anchor.nextSibling) {
          insert(el, container, anchor.nextSibling)
        }
      }
      // update props after migration is complete
      // element update attribute
      if (!isEqual(c1n.props, c2n.props)) {
        const isComponent = isVNodeComponent(c2n) && isVNodeComponent(c1n)
        if (isComponent) {
          patchComponent(c1n, c2n, container, anchor, parentComponent)
        } else {
          patchProps(
            el as HTMLElement,
            c1n,
            extend({}, c2n, { props: removeBuiltInProps(c2n.props) })
          )
        }
      }
      // 1, end

      if (c1n.children || c2n.children) {
        // 2, update the nodes with the same key value, including the child nodes.
        // sub-level nodes need to be patched again
        patchChildren(c1n, c2n, container, anchor, parentComponent, isSvg)
        // 2, end
      }

      // mark nodes that have been moved and do not need to be uninstalled in the third step
      c1n.inserted = true
    } else {
      patch(null, c2n, container, anchor, parentComponent, isSvg)
    }
    i++
  }

  for (const node of Object.values(o1)) {
    if (!node.inserted) {
      // 3, uninstall the old nodes that are not used.
      unmount(node)
      // 3, end
    }
  }
}

function patchChildren(
  n1: VNode,
  n2: VNode,
  container: RenderElement,
  anchor: RenderElement,
  parentComponent: Component,
  isSvg: boolean
) {
  if (isFunction(n1.children) && isFunction(n2.children)) {
    // when the child nodes are all functions, they should be called by the parent node.
    // <Parent>{count => <Title count={count} />}</Parent>
    return
  }

  const c1memo = n1.props.memo
  const c2memo = n2.props.memo
  if (isArray(c1memo) && isArray(c2memo)) {
    const index = c1memo.findIndex((item, index) => {
      return c2memo[index] !== item
    })
    if (index < 0) {
      n2.children = n1.children
      return
    }
  }

  const c1 = n1.children as VNode[]
  const c2: VNode[] = (n2.children = normalizeChildrenVNode(n2))

  if (c1?.length || c2?.length) {
    if (isKeyPatch(c1, c2)) {
      const el = (n2.el = n1.el)
      patchKeyed(c1, c2, el || container, anchor, parentComponent, isSvg)
    } else {
      // if the fragment node does not have a dom instance, use the container
      const el = (n2.el = n1.el)
      if (c1) {
        patchNonKeyed(c1, c2, el || container, anchor, parentComponent, isSvg)
      } else {
        mountChildren(c2, el || container, anchor, 0, parentComponent, isSvg)
      }
    }
  }
}

function mountElement(
  vnode: VNode,
  container: RenderElement,
  anchor: RenderElement,
  parentComponent: Component,
  isSvg: boolean
) {
  const { tag, is } = vnode
  const el = createElement(tag, isSvg, is) as RenderElement
  el.__vnode__ = vnode

  vnode.el = el

  if (vnode.props && vnode.props.ref) {
    setRef(el, vnode.props.ref)
  }

  const props = removeBuiltInProps(vnode.props)
  if (keys(props).length > 0) {
    mountProps(el as HTMLElement, extend({}, vnode, { props: props }))
  }

  if (shouldValue(vnode.children)) {
    vnode.children = normalizeChildrenVNode(vnode)
    mountChildren(vnode.children, vnode.el, anchor, 0, parentComponent, isSvg)
  }

  insert(el, container, anchor)
}

function patchElement(
  n1: VNode,
  n2: VNode,
  container: RenderElement,
  anchor: RenderElement,
  parentComponent: Component,
  isSvg: boolean
) {
  const el = (n2.el = n1.el) as HTMLElement
  if (!isEqual(n1.props, n2.props) || isSelectElement(n2)) {
    patchProps(el, n1, extend({}, n2, { props: removeBuiltInProps(n2.props) }))
  }
  if (n1.children || n2.children) {
    patchChildren(n1, n2, container, anchor, parentComponent, isSvg)
  }
}

function renderComponentEffect(
  component: Component,
  ssrMessage: SSRMessage = null
) {
  function patchSubTree(prevTree: VNode, nextTree: VNode) {
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
      patch(
        null,
        nextTree,
        component.$parent,
        component.vnode.anchor,
        component
      )
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
  function updateComponentEffect() {
    if (component.mounted) {
      // if the onBeforeUpdate callback function returns falsy
      // no update of the component is performed
      if (shouldUpdate(invokeLifecycle(component, 'beforeUpdates'))) {
        if (__DEV__) {
          refreshComponentType(component.vnode, component)
        }

        const prevTree = component.subTree
        const nextTree = renderComponent(component)
        if (isPromise(nextTree)) {
          warn(
            'Asynchronous components without wrapping are not supported, please use FCA wrapping',
            component,
            'UpdateComponent'
          )
        } else {
          patchSubTree(prevTree, nextTree)
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
          warn(
            'Asynchronous components without wrapping are not supported, please use FCA wrapping',
            component,
            'SetupPatch'
          )
        } else {
          patchSubTree(null, nextTree)
        }
      }
    }
  }

  const effect = (component.effect = createEffect(updateComponentEffect, () =>
    pushQueueJob(component.update)
  ))

  const update = (component.update = effect.run.bind(effect) as SchedulerJob)
  update.id = component.uid
  update.component = component
  update.priority = JobPriority.NORMAL_TIMEOUT
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

function patchComponent(
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
        component.update()
      }
    } else {
      component.update()
    }
  } else {
    if (__WARN__) {
      console.warn('Component update exception', n1)
    }
    mountComponent(n2, container, anchor, parentComponent)
  }
}

function enterComponent(
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
    patchComponent(n1, n2, container, anchor, parentComponent)
  }
}

function enterElement(
  n1: VNode | null,
  n2: VNode,
  container: RenderElement,
  anchor: RenderElement,
  parentComponent: Component,
  isSvg: boolean
) {
  isSvg = isSvg || n2.tag === 'svg'

  if (n1 === null) {
    mountElement(n2, container, anchor, parentComponent, isSvg)
  } else {
    patchElement(n1, n2, container, anchor, parentComponent, isSvg)
  }
}

function enterFragment(
  n1: VNode | null,
  n2: VNode,
  container: RenderElement,
  anchor: RenderElement,
  parentComponent: Component,
  isSvg: boolean
) {
  const fragmentEndAnchor = (n2.anchor = n1 ? n1.anchor : createText(''))
  if (n1 === null) {
    n2.anchor = fragmentEndAnchor
    insert(fragmentEndAnchor, container, anchor)

    n2.children = normalizeChildrenVNode(n2)
    mountChildren(
      n2.children,
      container,
      fragmentEndAnchor,
      0,
      parentComponent,
      isSvg
    )
  } else {
    patchChildren(n1, n2, container, fragmentEndAnchor, parentComponent, isSvg)
  }
}

function enterComment(
  n1: VNode | null,
  n2: VNode,
  container: RenderElement,
  anchor: RenderElement
) {
  if (n1 === null) {
    const comment = createComment(
      (n2.children as string) || ''
    ) as RenderElement
    comment.__vnode__ = n2

    n2.el = comment as RenderElement
    insert(comment, container, anchor)
  } else {
    n2.el = n1.el
    n2.el.__vnode__ = n2
  }
}

function enterText(
  n1: VNode | null,
  n2: VNode,
  container: RenderElement,
  anchor: RenderElement
) {
  if (n1 === null || !n1.el) {
    // when hydrating the code, since there is no empty text node on the server side, you need to execute mountText
    const textNode = createText(n2.children as string) as RenderElement

    textNode.__vnode__ = n2
    n2.el = textNode

    insert(textNode, container, anchor)
  } else {
    const el = (n2.el = n1.el)

    const c1 = '' + n1.children
    const c2 = '' + n2.children

    if (c1 !== c2) {
      el.textContent = c2
    }
  }
}

export function patch(
  n1: VNode | null,
  n2: VNode,
  container: RenderElement,
  anchor: RenderElement | null = null,
  parentComponent: Component | null = null,
  isSvg = false
) {
  if (!container) {
    throw new Error(
      'The parent element is not found when updating, please check the code.'
    )
  }

  if (n1 && !isSameVNodeType(n1, n2)) {
    anchor = getNextSibling(n1)
    unmount(n1)
    n1 = null
  }

  switch (n2.type) {
    case Text:
      enterText(n1, n2, container, anchor)
      break
    case Comment:
      enterComment(n1, n2, container, anchor)
      break
    case Element:
      enterElement(n1, n2, container, anchor, parentComponent, isSvg)
      break
    case Fragment:
      enterFragment(n1, n2, container, anchor, parentComponent, isSvg)
      break
    default:
      enterComponent(
        n1 as VNode<ComponentSetupFunction>,
        n2 as VNode<ComponentSetupFunction>,
        container,
        anchor,
        parentComponent
      )
  }
}
