import { createInstance, createComment, h } from '@gyron/runtime'
import type { Noop } from '@gyron/shared'

export function appEnv(s: any, f: Noop) {
  createInstance(
    h(() => {
      f()
      return createComment()
    })
  ).render(document.createElement('div'))
}
