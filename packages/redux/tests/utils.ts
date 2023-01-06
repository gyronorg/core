import { createInstance, createVNodeComment, h } from '@gyron/runtime'
import { Provider } from '../src/store'
import type { Noop } from '@gyron/shared'

export function appEnv(s: any, f: Noop) {
  createInstance(
    h(
      Provider,
      { store: s },
      h(() => {
        f()
        return createVNodeComment()
      })
    )
  ).render(document.createElement('div'))
}
