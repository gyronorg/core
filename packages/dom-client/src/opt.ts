import { isComment } from '@gyron/shared'

export const NS = 'http://www.w3.org/2000/svg'

export function insert(child: Node, parent: Node, anchor?: Node) {
  if (anchor && parent.contains(anchor)) {
    parent.insertBefore(child, anchor)
  } else {
    append(child, parent)
  }
}

export function append(child: Node, parent: any) {
  parent.appendChild(child)
}

export function remove(child: Element | Comment) {
  child.remove()
}

export function createElement(tag: string, isSvg?: boolean, is?: any) {
  const el = isSvg
    ? document.createElementNS(NS, tag)
    : document.createElement(tag, is ? { is } : undefined)

  return el
}

export function createText(text: string) {
  return document.createTextNode(text)
}

export function createComment(data?: string) {
  return document.createComment(data || '')
}

export function nextSibling(node: Node) {
  let nextNode = node.nextSibling
  while (nextNode && isComment(nextNode) && nextNode.data === '|') {
    nextNode = nextNode.nextSibling
  }
  return nextNode
}

export function querySelector(selector: string, container?: Element) {
  return (container || document).querySelector(selector)
}
