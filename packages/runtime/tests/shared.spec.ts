import {
  isVNodeElement,
  isVNodeText,
  isVNodeComment,
  isVNodeFragment,
  h,
  createText,
  createComment,
  createFragment,
} from '../src'

test('shared', () => {
  expect(isVNodeElement(h('div'))).toBe(true)
  expect(isVNodeText(createText(''))).toBe(true)
  expect(isVNodeComment(createComment(''))).toBe(true)
  expect(isVNodeFragment(createFragment([]))).toBe(true)
})
