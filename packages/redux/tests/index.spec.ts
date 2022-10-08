import { useEffect } from '@gyron/runtime'
import { createSlice, createStore, useDispatch, useSelector } from '../src'
import { appEnv } from './utils'

describe('redux basics', () => {
  test('store slice useEffect', () => {
    const { reducer, actions } = createSlice({
      name: 'counter',
      initialState: {
        count: 0,
      },
      reducers: {
        increment: (state) => {
          state.count++
        },
      },
    })
    const store = createStore({
      reducer: reducer,
    })
    appEnv(store, () => {
      const state = useSelector()
      const effect = jest.fn(() => {
        const count = store.extra.getState().count
        expect(state.count).toBe(count)
      })
      useEffect(effect)
      expect(effect).toHaveBeenCalledTimes(1)
      expect(store.extra.getState().count).toBe(0)
      store.extra.dispatch(actions.increment())
      expect(effect).toHaveBeenCalledTimes(2)
      expect(store.extra.getState().count).toBe(1)
    })
  })

  test('useDispatch', () => {
    const { reducer, actions } = createSlice({
      name: 'names',
      initialState: {
        names: [],
      },
      reducers: {
        increment: (state) => {
          state.names.push(state.names.length)
        },
      },
    })
    const store = createStore({
      reducer: reducer,
    })
    appEnv(store, () => {
      const dispatch = useDispatch()
      const state = useSelector()
      const effect = jest.fn(() => {
        const names = store.extra.getState().names
        expect(state.names.length).toBe(names.length)
      })
      useEffect(effect)
      expect(effect).toHaveBeenCalledTimes(1)
      dispatch(actions.increment())
      // array change by length and index
      expect(effect).toHaveBeenCalledTimes(3)
      expect(store.extra.getState().names.length).toBe(1)
    })
  })
})
