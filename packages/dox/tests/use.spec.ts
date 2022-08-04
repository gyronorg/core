import { createInstance, createVNode, FC, h, nextRender } from '@gyron/runtime'
import { createAction, createReducer, createStore, useStore } from '../src'

test('use', async () => {
  const container = document.createElement('div')
  const increment = createAction('counter/increment')
  const store = createStore({
    reducer: createReducer({ count: 0 }, (builder) => {
      builder.addCase(increment, (state) => {
        state.count++
      })
    }),
  })
  const Child = FC<{ count: number }>(() => {
    return ({ count }) => createVNode('span', null, count)
  })
  const App = h(() => {
    const store = useStore()
    const state = store.getState()
    return () => h(Child, { count: state.count })
  })
  createInstance(App).render(container)
  expect(container.innerHTML).toBe('<span>0</span>')
  store.extra.dispatch(increment())
  await nextRender()
  expect(container.innerHTML).toBe('<span>1</span>')
})
