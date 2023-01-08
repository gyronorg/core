import { VNode } from './vnode'
import { FC } from './component'
import { isNumber } from '@gyron/shared'
import { isVNode, isVNodeComment } from '.'
import { Noop } from '@gyron/shared'

interface TransitionPropsNormalize {
  cls: {
    activeBefore: string
    active: string
    leaveBefore: string
    leave: string
  }
  duration: { active: number; leave: number }
}

export interface TransitionHooks {
  state: ReturnType<typeof useTransitionState>

  __uid__?: number

  onActive: (el: Element) => void
  onActiveFinish: (el: Element) => void
  onLeave: (el: Element, done: Noop) => void
  onLeaveFinish: (el: Element) => void
  // TODO for transition group
  delayLeave?: (el: Element, done?: Noop) => void
}

type Duration = number | { active: number; leave: number }

export interface TransitionProps {
  name: string
  activeBeforeClassName?: string
  activeClassName?: string
  leaveBeforeClassName?: string
  leaveClassName?: string
  duration?: Duration
}

function normalizedClassName(props: TransitionProps) {
  return {
    activeBefore: props.activeBeforeClassName || `${props.name}-active-before`,
    active: props.activeClassName || `${props.name}-active`,
    leaveBefore: props.leaveBeforeClassName || `${props.name}-leave-before`,
    leave: props.leaveClassName || `${props.name}-leave`,
  }
}

// 动画的不同状态
// 1，进入前的动画
// 2，进入中的动画 requestAnimationFrame -> requestAnimationFrame
// 3，离开前的动画
// 4，离开中的动画 requestAnimationFrame -> requestAnimationFrame
// 通过 render scope 将状态 set 到真实元素中，然后再进入到合适的时机将状态取出

// 用户节点的状态（适应普通节点和组件节点）
// 1，节点更换（从A到B 或者 从B到A）
// 2，节点删除（从A到空 或者 从空到A）
// beforeActive - active
// beforeLeave - leave

// 取消机制
// 1，取消当状态发生变更时，上一次任务还未执行的情况

// 实现
// 1，一些事件应该挂载到元素上，发生变更时执行对应的事件。
//   比如A离开，B进入，那么应该执行A的 beforeLeave 和 leave ，同时执行B的 beforeActive 和 active 事件。

let _uid = 0
function whenTransitionEnd(
  el: Element & { __uid__?: number },
  duration: number | null,
  done: Noop
) {
  const id = (el.__uid__ = ++_uid)

  function onEnd() {
    el.removeEventListener('transitionend', onEnd)
    if (el.__uid__ === id) {
      // No less than 1 animation execution of the element occurs, and no callbacks are executed before
      done()
    }
  }

  if (isNumber(duration)) {
    return setTimeout(onEnd, duration)
  }
  el.addEventListener('transitionend', onEnd)
}
function onAddClassName(el: Element, name: string) {
  el.classList.add(name)
}
function onRemoveClassName(el: Element, name: string) {
  el.classList.remove(name)
}
function onBeforeActiveHook(el: Element, props: TransitionPropsNormalize) {
  onAddClassName(el, props.cls.activeBefore)
}
function onActiveHook(
  el: Element,
  props: TransitionPropsNormalize,
  done: Noop
) {
  return requestAnimationFrame(() => {
    whenTransitionEnd(el, props.duration?.active, () => {
      onRemoveClassName(el, props.cls.active)
      done()
    })
    onRemoveClassName(el, props.cls.activeBefore)
    onAddClassName(el, props.cls.active)
  })
}
function onActiveCancelHook(el: Element, props: TransitionPropsNormalize) {
  onRemoveClassName(el, props.cls.active)
}
function onBeforeLeaveHook(el: Element, props: TransitionPropsNormalize) {
  onAddClassName(el, props.cls.leaveBefore)
}
function onLeaveHook(el: Element, props: TransitionPropsNormalize, done: Noop) {
  return requestAnimationFrame(() => {
    whenTransitionEnd(el, props.duration?.leave, () => {
      onRemoveClassName(el, props.cls.leave)
      done()
    })
    onRemoveClassName(el, props.cls.leaveBefore)
    onAddClassName(el, props.cls.leave)
  })
}
function onLeaveCancelHook(el: Element, props: TransitionPropsNormalize) {
  onRemoveClassName(el, props.cls.leave)
}

function normalizeTransitionProps(
  props: TransitionProps
): TransitionPropsNormalize {
  function normalizeDuration(duration: Duration) {
    if (isNumber(duration)) {
      return {
        active: duration,
        leave: duration,
      }
    }
    return duration
  }
  return {
    cls: normalizedClassName(props),
    duration: normalizeDuration(props.duration),
  }
}

function useTransitionState() {
  const innerCache = new Map<any, VNode>()
  return {
    innerCache,
    transitionActivating: false,
    transitionLeaving: false,
  }
}

function generateTransitionHook(
  vnode: VNode,
  state: ReturnType<typeof useTransitionState>,
  props: TransitionPropsNormalize
): TransitionHooks {
  return {
    state: state,
    onActive(el) {
      state.transitionActivating = true
      if (state.transitionLeaving) {
        onLeaveCancelHook(el, props)
      }
      onBeforeActiveHook(el, props)
      onActiveHook(el, props, () => {
        state.transitionActivating = false
        state.innerCache.set(vnode.type, vnode)
      })
    },
    onActiveFinish(el) {
      onRemoveClassName(el, props.cls.activeBefore)
      onRemoveClassName(el, props.cls.active)
      state.transitionActivating = false
    },
    onLeave(el, remove) {
      state.transitionLeaving = true
      if (state.transitionActivating) {
        onActiveCancelHook(el, props)
      }
      onBeforeLeaveHook(el, props)
      onLeaveHook(el, props, () => {
        state.transitionLeaving = false
        state.innerCache.delete(vnode.type)
        remove()
      })
    },
    onLeaveFinish(el) {
      onRemoveClassName(el, props.cls.leaveBefore)
      onRemoveClassName(el, props.cls.leave)
      state.transitionLeaving = false
    },
  }
}

function setTransition(vnode: VNode, hooks: TransitionHooks) {
  vnode.transition = hooks
}

export const Transition = FC<TransitionProps>(function Transition() {
  const state = useTransitionState()
  return function TransitionChildren(props, component) {
    const child = props.children
    const oldChild = component.subTree

    const normalizeProps = normalizeTransitionProps(props)
    if (isVNode(child) && !isVNodeComment(child)) {
      setTransition(child, generateTransitionHook(child, state, normalizeProps))
    }

    if (isVNode(oldChild) && !isVNodeComment(oldChild)) {
      setTransition(
        oldChild,
        generateTransitionHook(oldChild, state, normalizeProps)
      )
    }

    return child
  }
})
