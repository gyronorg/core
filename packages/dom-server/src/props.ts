import {
  VNodeProps,
  removeBuiltInProps,
  VNodeChildren,
  warn,
} from '@gyron/runtime'
import { isEventProps, isString, shouldValue } from '@gyron/shared'
import { SSRBuffer } from './buffer'

function renderStyle(buffer: SSRBuffer, styles: string | object) {
  if (isString(styles)) {
    buffer.push(` style="${styles}"`)
  } else {
    const res = Object.entries(styles)
      .reduce((style, [key, value]) => {
        style.push(
          `${key.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())}: ${value}`
        )
        return style
      }, [])
      .join('; ')

    if (res) {
      buffer.push(` style="${res}"`)
    }
  }
}

export function renderProps(
  buffer: SSRBuffer,
  props: Partial<VNodeProps>,
  children: VNodeChildren
) {
  for (const k in removeBuiltInProps(props)) {
    switch (k) {
      case 'style':
        renderStyle(buffer, props[k])
        break
      case 'className':
        buffer.push(` class="${props[k]}"`)
        break
      case '_html':
        if (shouldValue(children)) {
          warn(
            'Both the _html attribute and the child node exist in the node.',
            null,
            'SSR Render Props'
          )
        } else {
          buffer.insert(props['_html'])
        }
        break
      default:
        if (!isEventProps(k)) {
          buffer.push(` ${k}="${props[k]}"`)
        }
    }
  }
}
