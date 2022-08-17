import { isArray } from '@gyron/shared'
import { diff } from 'deep-diff'

export function getValueWithPath(
  path: any[],
  obj: object,
  cb: (obj: any, cur: any) => void
) {
  path.reduce((pre, cur, index) => {
    if (index === path.length - 1) {
      cb(pre, cur)
    }
    return pre[cur]
  }, obj)
}

export function sync(target: object, source: object) {
  const diffs = diff(target, source)

  if (!isArray(diffs)) return

  diffs.forEach((v) => {
    const { kind, path } = v
    // Sync redux data to useReactive to update the View
    if (kind === 'N' || kind === 'E') {
      getValueWithPath(path, target, (obj, cur) => {
        obj[cur] = v.rhs
      })
    }
    if (kind === 'D') {
      getValueWithPath(path, target, (obj, cur) => {
        delete obj[cur]
      })
    }
    if (kind === 'A') {
      getValueWithPath(path, target, (obj, cur) => {
        if (v.item.kind === 'N') {
          obj[cur].push(v.item.rhs)
        }
        if (v.item.kind === 'D') {
          obj[cur].length = v.index
        }
        if (v.item.kind === 'E') {
          obj[cur][v.index] = v.item.rhs
        }
      })
    }
  })
}
