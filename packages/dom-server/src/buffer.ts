import { isPromise, isString } from '@gyron/shared'

type SSRBufferItem = string | SSRBuffer | Promise<string | SSRBuffer>

export class SSRBuffer {
  private _buffer: SSRBufferItem[] = []
  private _children: string

  push(data: SSRBufferItem) {
    this._buffer.push(data)
    if (data === '>' && this._children) {
      this._buffer.push(this._children)
      this._children = null
    }
  }

  insert(_children: string) {
    this._children = _children
  }

  get buffer() {
    return this._buffer
  }
}

export async function renderBuffer(buffer: SSRBufferItem[]) {
  const buffers: SSRBufferItem[] = buffer
  let res = ''
  for (let i = 0; i < buffers.length; i++) {
    const data = buffers[i]
    if (isPromise(data)) {
      const asyncResult = await data
      if (asyncResult instanceof SSRBuffer) {
        res += await renderBuffer(asyncResult.buffer)
      }
    } else if (isString(data)) {
      res += data
    } else {
      res += await renderBuffer(data.buffer)
    }
  }
  return res
}
