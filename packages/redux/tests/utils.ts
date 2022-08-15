import { createInstance, createVNodeComment, h } from '@gyron/runtime'
import type { Noop } from '@gyron/shared'

export function appEnv(s: any, f: Noop) {
  createInstance(
    h(() => {
      f()
      return createVNodeComment()
    })
  ).render(document.createElement('div'))
}
