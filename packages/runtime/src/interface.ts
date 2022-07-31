type ToUpper<T extends string> = T extends `${infer F}${infer Rest}`
  ? `${Uppercase<F>}${Rest}`
  : never

type ToLower<T extends string> = T extends `${infer F}${infer Rest}`
  ? `${Lowercase<F>}${Rest}`
  : never

type APrefixEvent<K extends string, P extends string> = K extends string
  ? `${P}${ToUpper<K>}`
  : never

type RPrefixEvent<
  K extends string,
  P extends string
> = K extends `${P}${infer Key}` ? ToLower<Key> : never

type Prefix = 'on'

export type VNodeEvent = {
  [Key in APrefixEvent<keyof HTMLElementEventMap, Prefix>]?: (
    e: HTMLElementEventMap[RPrefixEvent<Key, Prefix>]
  ) => any
}
