export function info(...message: any[]) {
  console.log(`[${message[0]}]: `, ...message.slice(1))
}

export function warn(...message: any[]) {
  console.warn(`[${message[0]}]: `, ...message.slice(1))
}

export function error(...message: any[]) {
  console.error(`[${message[0]}]: `, ...message.slice(1))
}
