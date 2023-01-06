import { VNode } from './vnode'
import { FC } from './component'
import { isNumber } from '@gyron/shared'
import { isVNode, isVNodeComment } from '.'
import { Noop } from '@gyron/shared'

interface NormalizeTransitionProps {
  cls: {
    activeBefore: string
    active: string
    leaveBefore: string
    leave: string
  }
  duration: { active: number; leave: number }
}

export interface TransitionHooks {
  onBeforeActive: (el: Element) => void
  onActive: (el: Element) => void
  onActiveCancel: (el: Element) => void
  onBeforeLeave: (el: Element) => void
  onLeave: (el: Element, done: Noop) => void
  onLeaveCancel: (el: Element) => void
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

  if (isNumber(duration)) {
    return setTimeout(onEnd, duration)
  }
  el.addEventListener('transitionend', onEnd)
  function onEnd() {
    el.removeEventListener('transitionend', onEnd)
    if (el.__uid__ === id) {
      done()
    }
  }
}
function onAddClassName(el: Element, name: string) {
  el.classList.add(name)
}
function onRemoveClassName(el: Element, name: string) {
  el.classList.remove(name)
}
function onBeforeActive(el: Element, props: NormalizeTransitionProps) {
  onAddClassName(el, props.cls.activeBefore)
}
function onActive(el: Element, props: NormalizeTransitionProps) {
  return requestAnimationFrame(() => {
    whenTransitionEnd(el, props.duration?.active, () => {
      onRemoveClassName(el, props.cls.active)
    })
    onRemoveClassName(el, props.cls.activeBefore)
    onAddClassName(el, props.cls.active)
  })
}
function onActiveCancel(el: Element, props: NormalizeTransitionProps) {
  onRemoveClassName(el, props.cls.active)
}
function onBeforeLeave(el: Element, props: NormalizeTransitionProps) {
  onAddClassName(el, props.cls.leaveBefore)
}
function onLeave(el: Element, props: NormalizeTransitionProps, done: Noop) {
  return requestAnimationFrame(() => {
    whenTransitionEnd(el, props.duration?.leave, () => {
      onRemoveClassName(el, props.cls.leave)
      done()
    })
    onRemoveClassName(el, props.cls.leaveBefore)
    onAddClassName(el, props.cls.leave)
  })
}
function onLeaveCancel(el: Element, props: NormalizeTransitionProps) {
  onRemoveClassName(el, props.cls.leave)
}

function normalizeTransitionProps(
  props: TransitionProps
): NormalizeTransitionProps {
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
  }
}

function generateTransitionHook(
  vnode: VNode,
  props: NormalizeTransitionProps
): TransitionHooks {
  return {
    onBeforeActive(el) {
      onBeforeActive(el, props)
    },
    onActive(el) {
      onActive(el, props)
    },
    onActiveCancel(el) {
      onActiveCancel(el, props)
    },
    onBeforeLeave(el) {
      onBeforeLeave(el, props)
    },
    onLeave(el, done) {
      onLeave(el, props, done)
    },
    onLeaveCancel(el) {
      onLeaveCancel(el, props)
    },
  }
}

export const Transition = FC<TransitionProps>(function Transition() {
  const state = useTransitionState()
  return function TransitionChildren(props, component) {
    const child = props.children
    const oldChild = component.subTree

    const normalizeProps = normalizeTransitionProps(props)
    // 实现
    // 1，将hook装填到VNode上
    // 2，在render周期里面调用VNode上的装填的hook
    // 3，有延迟删除的VNode需要实现 delayLeave
    if (isVNode(child) && !isVNodeComment(child)) {
      child.transition = generateTransitionHook(child, normalizeProps)
    }

    if (isVNode(oldChild) && !isVNodeComment(oldChild)) {
      oldChild.transition = generateTransitionHook(oldChild, normalizeProps)
    }

    // if (
    //   isVNode(child) &&
    //   isVNode(oldChild) &&
    //   !isSameVNodeType(child, oldChild)
    // ) {
    //   oldChild.transition.delayLeave = (el, done) => {
    //     oldChild.transition.onBeforeLeave(el)
    //     done()
    //   }
    // }

    return child
  }
})
