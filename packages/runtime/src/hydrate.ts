import type { VNode, RenderElement } from './vnode'
import type { SSRMessage } from './ssr'
import { shouldValue, isComment, extend, keys } from '@gyron/shared'
import { warn } from '@gyron/logger'
import {
  createComment,
  insert,
  mountProps,
  nextSibling,
  remove,
} from '@gyron/dom-client'
import {
  Component,
  ComponentSetupFunction,
  removeBuiltInProps,
} from './component'
import {
  Text,
  Comment,
  Fragment,
  Element,
  NodeType,
  normalizeChildrenVNode,
  normalizeVNodeWithLink,
} from './vnode'
import { mountComponent, patch } from './renderer'
import { setRef } from './ref'

/**
 * Find the tag at the end of the Fragment and return the first node after the end
 * @param node "[" annotation node
 * @returns returns the first node after the "]" node
 */
function locateClosingAsyncAnchor(node: Node): Node {
  let match = 0
  while (node) {
    node = nextSibling(node)
    if (node && isComment(node)) {
      if (node.data === '[') match++
      if (node.data === ']') {
        if (match === 0) {
          return nextSibling(node)
        } else {
          match--
        }
      }
    }
  }
  return node
}

function mismatch(node: RenderElement, vnode: VNode, isFragment: boolean) {
  if (__DEV__) {
    warn(
      'hydrate',
      `server render mismatch.\nClient Type: `,
      node,
      `\nServer Type: `,
      vnode
    )
  }

  vnode.el = null

  if (isFragment) {
    // remove excessive fragment nodes
    const end = locateClosingAsyncAnchor(node)
    while (true) {
      const next = nextSibling(node)
      if (next && next !== end) {
        remove(next as Element)
      } else {
        break
      }
    }
  }

  const next = nextSibling(node)
  const container = node.parentNode
  remove(node as Element)

  // Assert that client-side html and server-side vnode render do not match, re-render
  patch(null, vnode, container, next)
  return next
}

/**
 * Hydrate static resources to ensure ssr client responsiveness
 * @api global
 * @param node Node in a document
 * @param vnode Virtual node
 */
export function hydrate(
  node: RenderElement,
  vnode: VNode,
  parentComponent: Component = null,
  ssrMessage: SSRMessage = null
) {
  const isFragmentStart = isComment(node) && node.data === '['
  const { type, children } = vnode

  vnode.el = node

  let nextNode: RenderElement = null
  switch (type) {
    case Text:
      const textNode = node as Text
      if (node.nodeType !== NodeType.Text) {
        nextNode = mismatch(node, vnode, isFragmentStart)
      } else {
        if (textNode.data !== children) {
          if (__DEV__) {
            warn(
              'hydrate',
              `text data mismatch.\nserver text: ${textNode.data}\nclient text: ${children}`
            )
          }
          textNode.data = children as string
        }
        nextNode = nextSibling(node)
      }
      break
    case Comment:
      const commentNode = node as Comment
      if (node.nodeType !== NodeType.Comment) {
        nextNode = mismatch(node, vnode, isFragmentStart)
      } else {
        commentNode.data = (children || '') as string
        nextNode = nextSibling(node)
      }
      break
    case Fragment:
      if (!isFragmentStart) {
        nextNode = mismatch(node, vnode, isFragmentStart)
      } else {
        nextNode = hydrateFragment(node, vnode, parentComponent, ssrMessage)
      }
      break
    case Element:
      if (node.nodeType !== NodeType.Element) {
        nextNode = mismatch(node, vnode, isFragmentStart)
      } else {
        nextNode = hydrateElement(node, vnode, parentComponent, ssrMessage)
      }
      break
    default:
      hydrateComponent(
        vnode as VNode<ComponentSetupFunction>,
        parentComponent,
        ssrMessage
      )
      nextNode = isFragmentStart
        ? locateClosingAsyncAnchor(node)
        : nextSibling(node)
  }

  return nextNode
}

function hydrateComponent(
  vnode: VNode<ComponentSetupFunction>,
  parentComponent: Component = null,
  ssrMessage: SSRMessage = null
) {
  const container = vnode.el.parentNode
  if (ssrMessage && vnode.__uri) {
    // use server-side data hydrate client
    const ssrProps = ssrMessage[vnode.__uri]
    extend(vnode.props, ssrProps)
  }
  mountComponent(vnode, container, vnode.anchor, parentComponent, ssrMessage)
}

function hydrateFragment(
  node: RenderElement,
  vnode: VNode,
  parentComponent: Component = null,
  ssrMessage: SSRMessage = null
) {
  const container = node.parentNode

  // fragment not container
  // clear el
  vnode.el = null

  const next = hydrateChildren(
    nextSibling(node),
    vnode,
    container,
    parentComponent,
    ssrMessage
  )
  if (next && isComment(next) && next.data === ']') {
    return nextSibling((vnode.anchor = next))
  } else {
    if (__DEV__) {
      warn(
        'hydrate',
        'RenderToString did not handle the fragment correctly, no terminator found'
      )
    }
    insert((vnode.anchor = createComment(`]`)), container, next)
    return next
  }
}

function hydrateElement(
  node: RenderElement,
  vnode: VNode,
  parentComponent: Component = null,
  ssrMessage: SSRMessage = null
) {
  const { children, el } = vnode

  if (vnode.props.ref) {
    setRef(el, vnode.props.ref)
  }

  const props = removeBuiltInProps(vnode.props)
  if (shouldValue(keys(props))) {
    mountProps(el as HTMLElement, extend({}, vnode, { props: props }))
  }

  if (shouldValue(children)) {
    vnode.children = normalizeChildrenVNode(vnode)
    hydrateChildren(node.firstChild, vnode, node, parentComponent, ssrMessage)
  }

  return nextSibling(node)
}

function hydrateChildren(
  node: RenderElement,
  parentVNode: VNode,
  container: RenderElement,
  parentComponent: Component = null,
  ssrMessage: SSRMessage = null
) {
  const children = parentVNode.children as VNode[]
  for (let i = 0; i < children.length; i++) {
    const vnode = normalizeVNodeWithLink(children[i], parentVNode)
    if (node) {
      node = hydrate(node, vnode, parentComponent, ssrMessage)
    } else if (vnode.type === Text) {
      continue
    } else {
      patch(null, vnode, container)
    }
  }
  return node
}
