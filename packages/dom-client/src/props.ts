import type { VNode, VNodeProps, EventOptions } from 'packages/gyron/src'
import {
  diffWord,
  isBoolean,
  isEventProps,
  isObject,
  isObjectPrototype,
  isString,
  keys,
  normalizeEventName,
  shouldValue,
} from '@gyron/shared'
import { warn } from '@gyron/logger'
import { isControlledElementProp, controlledElementValue } from './controlled'
import { NS } from './opt'

export type Listener = (e?: any) => any | EventOptions<any>
export type Style = string | Record<string, string>

interface DebugOption {
  update: (type: string, payload?: any) => void
}

function setAttribute(el: Element, key: string, value: any, vnode: VNode) {
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

function removeAttribute(el: Element, key: string) {
  if (el.nodeName === 'SVG') {
    el.removeAttributeNS(NS, key)
  } else {
    el.removeAttribute(key)
  }
}

function unmountProps(
  el: Element,
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

function isEventOption(e: any): e is EventOptions<any> {
  return isObjectPrototype(e)
}

function normalizedEvent(e: Listener): EventOptions<any> {
  if (isEventOption(e)) {
    return e
  }
  return { handleEvent: e, options: null }
}

function patchEvent(
  el: Element,
  key: string,
  oldEvent: Listener,
  newEvent: Listener,
  debugOption?: DebugOption
) {
  const oldHandler = normalizedEvent(oldEvent)
  const newHandler = normalizedEvent(newEvent)
  if (newHandler.handleEvent) {
    if (newHandler.handleEvent !== oldHandler.handleEvent) {
      if (el.nodeName === 'INPUT' && key === 'change') {
        key = 'input'
      }
      if (oldHandler.handleEvent) {
        el.removeEventListener(key, oldHandler.handleEvent, oldHandler.options)
      }
      el.addEventListener(key, newHandler.handleEvent, newHandler.options)
      if (__DEV__ && debugOption) {
        debugOption.update('event', key)
      }
    }
  } else {
    el.removeEventListener(key, oldHandler.handleEvent, oldHandler.options)
  }
}

function patchClass(
  el: Element,
  oldValue: string,
  value: string,
  debugOption?: DebugOption
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

  if (__DEV__ && debugOption && (D.length || A.length)) {
    debugOption.update('class')
  }
}

function patchStyle(
  el: Element,
  oldValue: Style | null,
  value: Style | null,
  vnode: VNode,
  debugOption?: DebugOption
) {
  if (isString(value)) {
    if (value !== oldValue) {
      setAttribute(el, 'style', value, vnode)
    }
  } else {
    if (isObject(value)) {
      for (const [css, cssValue] of Object.entries(value)) {
        if (!oldValue || oldValue[css] !== cssValue) {
          ;(el as HTMLElement).style[css] = cssValue
          if (__DEV__ && debugOption) {
            debugOption.update('style')
          }
        }
      }
      if (isObject(oldValue)) {
        for (const css in oldValue) {
          if (!value[css]) {
            ;(el as HTMLElement).style[css] = null
          }
        }
      }
    } else {
      removeAttribute(el, 'style')
    }
  }
}

export function patchProp(
  el: Element,
  key: string,
  vnode: VNode,
  oldValue?: any,
  newValue?: any,
  debugOption?: DebugOption
) {
  if (isEventProps(key)) {
    patchEvent(el, normalizeEventName(key), oldValue, newValue, debugOption)
  } else if (key === 'style') {
    patchStyle(el, oldValue, newValue, vnode, debugOption)
  } else if (key === 'class' || key === 'className') {
    patchClass(el, oldValue, newValue, debugOption)
  } else if (key === 'html') {
    if (shouldValue(vnode.children)) {
      warn(
        'dom-client',
        'Both the html attribute and the child node exist in the node.\n',
        vnode
      )
    } else {
      // completely re-render the child element, throwing a warning when the child element is not empty.
      el.innerHTML = newValue
    }
  } else {
    try {
      setAttribute(el, key, newValue, vnode)
    } catch (e) {
      warn('dom-client', e)
    }
  }
}

export function mountProps(el: Element, vnode: VNode) {
  for (const key in vnode.props) {
    patchProp(el, key, vnode, null, vnode.props[key])
  }
}

export function patchProps(el: Element, n1: VNode, n2: VNode) {
  const unmounts = []
  for (const key in n2.props) {
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
