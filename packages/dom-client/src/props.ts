import { VNode, VNodeProps, warn, removeBuiltInProps } from '@gyron/runtime'
import {
  diffWord,
  isBoolean,
  isEventProps,
  isString,
  keys,
  normalizeEventName,
} from '@gyron/shared'
import { isControlledElementProp, controlledElementValue } from './controlled'
import { NS } from './opt'

export type Listener = () => any
export type Style = string | Record<string, string>

function setAttribute(
  el: HTMLElement | SVGElement,
  key: string,
  value: any,
  vnode: VNode
) {
  if (el.nodeName === 'SVG') {
    el.setAttributeNS(NS, key, value)
  } else {
    if (isControlledElementProp(el, key)) {
      // controlled component values require special handling
      controlledElementValue(el, key, value, vnode)
    } else {
      if (isBoolean(value)) {
        // https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#boolean-attributes
        if (value) {
          el.setAttribute(key, '')
        } else {
          // attribute falsy should remove
          el.removeAttribute(key)
        }
      } else {
        el.setAttribute(key, value)
      }
    }
  }
}

function removeAttribute(el: HTMLElement | SVGElement, key: string) {
  if (el.nodeName === 'SVG') {
    el.removeAttributeNS(NS, key)
  } else {
    el.removeAttribute(key)
  }
}

function unmountProps(
  el: HTMLElement | SVGElement,
  unmounts: string[],
  props: Partial<VNodeProps>
) {
  for (const key of unmounts) {
    if (isEventProps(key)) {
      el.removeEventListener(normalizeEventName(key), props[key])
    } else {
      removeAttribute(el, key)
    }
  }
}

function patchEvent(
  el: HTMLElement | SVGElement,
  key: string,
  oldEvent: Listener,
  newEvent: Listener
) {
  if (newEvent) {
    if (newEvent !== oldEvent) {
      el.removeEventListener(key, oldEvent)
      el.addEventListener(key, newEvent)
    }
  }
}

function patchClass(
  el: HTMLElement | SVGElement,
  oldValue: string,
  value: string
) {
  if (oldValue === value) {
    return
  }

  const { D, A } = diffWord(
    isString(oldValue) ? oldValue.split(' ') : [],
    isString(value) ? value.split(' ') : []
  )

  el.classList.remove(...D)

  if (!value) {
    removeAttribute(el, 'class')
  } else {
    el.classList.add(...A)
  }
}

function patchStyle(
  el: HTMLElement | SVGElement,
  oldValue: Style,
  value: Style,
  vnode: VNode
) {
  if (isString(value)) {
    if (value !== oldValue) {
      setAttribute(el, 'style', value, vnode)
    }
  } else {
    removeAttribute(el, 'style')
    for (const [k, v] of Object.entries(value)) {
      el.style[k] = v
    }
  }
}

export function patchProp(
  el: HTMLElement | SVGElement,
  key: string,
  vnode: VNode,
  oldValue?: any,
  newValue?: any
) {
  if (isEventProps(key)) {
    patchEvent(el, normalizeEventName(key), oldValue, newValue)
  } else if (key === 'style') {
    patchStyle(el, oldValue, newValue, vnode)
  } else if (key === 'class' || key === 'className') {
    patchClass(el, oldValue, newValue)
  } else {
    try {
      setAttribute(el, key, newValue, vnode)
    } catch (e) {
      warn(e, null, 'PatchProp')
    }
  }
}

export function mountProps(el: HTMLElement | SVGElement, vnode: VNode) {
  for (const key in removeBuiltInProps(vnode.props)) {
    patchProp(el, key, vnode, null, vnode.props[key])
  }
}

export function patchProps(el: HTMLElement | SVGElement, n1: VNode, n2: VNode) {
  const unmounts = []
  for (const key in removeBuiltInProps(n2.props)) {
    unmounts.push(key)
    const oldValue = n1.props?.[key]
    const newValue = n2.props?.[key]
    patchProp(el, key, n2, oldValue, newValue)
  }

  // remove old props
  if (n1.props) {
    unmountProps(
      el,
      keys(n1.props).filter((key) => !unmounts.includes(key)),
      n1.props
    )
  }
}
