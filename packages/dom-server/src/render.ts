import {
  VNode,
  Text,
  Element,
  Comment,
  Fragment,
  createComponentInstance,
  renderComponent,
  Children,
  normalizeChildrenVNode,
  normalizeVNodeWithLink,
  Component,
  isVNode,
  isVNodeText,
  ComponentSetupFunction,
} from '@gyron/runtime'
import {
  escape,
  shouldValue,
  isFunction,
  isString,
  isPromise,
} from '@gyron/shared'
import { renderBuffer, SSRBuffer } from './buffer'
import { renderProps } from './props'

export function renderToString(vnode: VNode) {
  const buffer = renderComponentSubBuffer(vnode)
  return renderBuffer(buffer.buffer)
}

export function render(
  buffer: SSRBuffer,
  vnode: VNode,
  parentComponent: Component | null
) {
  const { type, children } = vnode

  switch (type) {
    case Text:
      buffer.push(escape(children))
      break
    case Comment:
      buffer.push(`<!--${children || ''}-->`)
      break
    case Fragment:
      buffer.push('<!--[-->')
      renderChildren(buffer, children as Children[], vnode, parentComponent)
      buffer.push('<!--]-->')
      break
    case Element:
      renderElement(buffer, vnode, parentComponent)
      break
    default:
      renderComponentSubBuffer(
        vnode as VNode<ComponentSetupFunction>,
        buffer,
        parentComponent
      )
  }
}

function isInsertSplitChar(
  prevNode: VNode | Children,
  nextNode: VNode | Children
) {
  const test = (node: VNode | Children) => {
    return node && isVNode(node) && isVNodeText(node) && isString(node.children)
  }

  return test(prevNode) && test(nextNode)
}

function renderChildren(
  buffer: SSRBuffer,
  nodes: VNode[] | Children[],
  parent: VNode,
  parentComponent: Component | null
) {
  for (let i = 0; i < nodes.length; i++) {
    const nextNode = nodes[i + 1]
    const node = normalizeVNodeWithLink(nodes[i], parent)
    nodes[i] = node
    render(buffer, node, parentComponent)

    // To turn the text nodes inside the fragment into separate dom nodes for easy hydration
    if (isInsertSplitChar(node, nextNode)) {
      buffer.push('<!--|-->')
    }
  }
}

function renderElement(
  buffer: SSRBuffer,
  vnode: VNode,
  parentComponent: Component | null
) {
  buffer.push(`<${vnode.tag}`)

  renderProps(buffer, vnode.props)

  buffer.push('>')

  if (shouldValue(vnode.children)) {
    vnode.children = normalizeChildrenVNode(vnode)
    renderChildren(buffer, vnode.children, vnode, parentComponent)
  }

  buffer.push(`</${vnode.tag}>`)
}

function renderComponentSubBuffer(
  vnode: VNode,
  bufferParent?: SSRBuffer,
  parentComponent?: Component | null
) {
  const buffer = new SSRBuffer()
  bufferParent && bufferParent.push(buffer)

  const instance = (vnode.component = createComponentInstance(
    vnode as VNode<ComponentSetupFunction>,
    parentComponent
  ))
  const subTree = isFunction(instance.type)
    ? renderComponent(instance, true)
    : vnode
  instance.parent = parentComponent

  if (isPromise(subTree)) {
    const bufferContainer = new SSRBuffer()
    const subTreeBuffer = subTree.then((vnode: VNode) => {
      render(bufferContainer, vnode, instance)
      return bufferContainer
    })
    buffer.push(subTreeBuffer)
  } else {
    render(buffer, subTree, instance)
  }

  return buffer
}
