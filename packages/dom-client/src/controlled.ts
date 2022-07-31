import { Component, VNode, RenderElement } from '@gyron/runtime'
import { isArray, isSet } from '@gyron/shared'

function setSelectValue(el: HTMLSelectElement, value: any) {
  const isMultiple = el.multiple
  if (isMultiple && !isArray(value) && !isSet(value)) {
    console.warn(
      'There is a multiple attribute in select, so the value of the value attribute must be an array'
    )
    return null
  }
  for (let i = 0; i < el.options.length; i++) {
    const option = el.options[i]
    const optionValue = option.value
    if (isMultiple) {
      if (isArray(value)) {
        option.selected = value.includes(optionValue)
      } else {
        option.selected = value.has(optionValue)
      }
    } else {
      if (optionValue === value) {
        if (el.selectedIndex !== i) {
          el.selectedIndex = i
        }
        return
      }
    }
  }
  if (!isMultiple && el.selectedIndex !== -1) {
    el.selectedIndex = -1
  }
}

function getComponentByVNode(vnode: VNode): void | Component {
  let parent = vnode
  while (parent && !parent.component) {
    parent = parent.parent
  }
  if (!parent) {
    console.warn(
      'No vnode found in the vnode chain containing component attributes',
      vnode
    )
    return null
  }
  return parent.component
}

function selectElementControlled(el: RenderElement, value: any, vnode: VNode) {
  const component = getComponentByVNode(vnode)
  if (component) {
    if (component.mounted) {
      setSelectValue(el as HTMLSelectElement, value)
    } else {
      component.lifecycle.afterMounts.add(
        setSelectValue.bind(null, el as HTMLSelectElement, value)
      )
    }
  }
}

export function controlledElementValue(
  el: RenderElement,
  key: string,
  value: any,
  vnode: VNode
) {
  switch (el.nodeName) {
    case 'SELECT':
      selectElementControlled(el, value, vnode)
      break
    default:
      el[key] = value
  }
}

export function isControlledElementProp(el: RenderElement, key: string) {
  switch (el.nodeName) {
    case 'SELECT':
    case 'TEXTAREA':
      return key === 'value'
    case 'INPUT':
      switch ((el as HTMLInputElement).type) {
        case 'radio':
        case 'checkbox':
          return key === 'checked'
        default:
          return key === 'value'
      }
  }
  return false
}
