import {
  isVNodeElement,
  isVNodeText,
  isVNodeComment,
  isVNodeFragment,
  h,
  createVNode,
  createVNodeComment,
} from '../src'

test('shared', () => {
  expect(isVNodeElement(h('div', null, null))).toBe(true)
  expect(isVNodeText(createVNode(''))).toBe(true)
  expect(isVNodeComment(createVNodeComment(''))).toBe(true)
  expect(isVNodeFragment(createVNode([]))).toBe(true)
})
