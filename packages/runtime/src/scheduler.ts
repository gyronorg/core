import type { Noop } from '@gyron/shared'
import type { Component } from './component'
import { callWithErrorHandling, ErrorHandlingType } from './renderComponent'

export interface SchedulerJob {
  (): void
  id: number
  component: Component
}

const queue: SchedulerJob[] = []
const resolvedPromise: Promise<unknown> = Promise.resolve()
let currentJobPromise: Promise<unknown>

export function nextRender(fn?: Noop) {
  const p = currentJobPromise || resolvedPromise
  return fn ? p.then(fn) : p
}

export function pushQueueJob(job: SchedulerJob) {
  if (job.id === null) {
    queue.push(job)
  } else {
    // Same component update using the latest data update
    // Array.prototype.splice will trigger update multiple times, the first time the data is incorrect, see Proxy splice set
    const index = queue.findIndex((x) => x.id === job.id)
    if (index >= 0) {
      queue.splice(index, 1, job)
    } else {
      queue.push(job)
    }
  }

  currentJobPromise = resolvedPromise.then(flushJobs)
}

export function flushJobs() {
  try {
    queue.sort((a, b) => a.id - b.id)
    for (let i = 0; i < queue.length; i++) {
      const job = queue[i]
      callWithErrorHandling(job, job.component, ErrorHandlingType.Scheduler)
    }
  } finally {
    queue.length = 0
  }
}
