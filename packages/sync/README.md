# sync

同步数据，`sync`函数解决响应数据同步时状态不更新的问题。

在 `gyron` 中负责 `dox` 状态库的数据同步。

```jsx
import { useReactive } from '@gyron/runtime'
import { sync } from '@gyron/sync'

const target = useReactive({})
const source = {
  foo: {
    bar: {
      baz: ['gyron', 'cool'],
    },
  },
}

sync(target, source)
```
