import { isUndefined, resolve } from '@gyron/shared'

export function resolveUrl(base: string, path: string) {
  if (base.endsWith('/')) {
    return resolve(base, path)
  }
  if (isUndefined(path) || path === '') {
    return base
  }
  return resolve(base, '..', path)
}
