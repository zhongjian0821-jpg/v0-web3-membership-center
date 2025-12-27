// EventEmitter polyfill for browser environment
export class EventEmitter {
  private _events: Map<string | symbol, Set<Function>> = new Map()
  private _maxListeners = 10

  setMaxListeners(n: number) {
    this._maxListeners = n
    return this
  }

  getMaxListeners() {
    return this._maxListeners
  }

  on(event: string | symbol, listener: Function) {
    if (!listener || typeof listener !== "function") return this

    if (!this._events.has(event)) {
      this._events.set(event, new Set())
    }
    this._events.get(event)!.add(listener)
    return this
  }

  addListener(event: string | symbol, listener: Function) {
    return this.on(event, listener)
  }

  once(event: string | symbol, listener: Function) {
    const onceWrapper = (...args: any[]) => {
      try {
        if (listener && typeof listener === "function") {
          listener.call(this, ...args)
        }
      } finally {
        this.removeListener(event, onceWrapper)
      }
    }
    return this.on(event, onceWrapper)
  }

  removeListener(event: string | symbol, listener: Function) {
    const listeners = this._events.get(event)
    if (listeners) {
      listeners.delete(listener)
      if (listeners.size === 0) {
        this._events.delete(event)
      }
    }
    return this
  }

  off(event: string | symbol, listener: Function) {
    return this.removeListener(event, listener)
  }

  removeAllListeners(event?: string | symbol) {
    if (event !== undefined) {
      this._events.delete(event)
    } else {
      this._events.clear()
    }
    return this
  }

  emit(event: string | symbol, ...args: any[]) {
    const listeners = this._events.get(event)
    if (!listeners || listeners.size === 0) {
      return false
    }

    // 复制 Set 避免在迭代时被修改
    const listenerArray = Array.from(listeners).filter(
      (l) => l && typeof l === "function" && typeof l.call === "function",
    )

    for (const listener of listenerArray) {
      try {
        // 使用 call 而不是 apply，更安全
        listener.call(this, ...args)
      } catch (error) {
        // 完全忽略错误，继续执行其他监听器
      }
    }

    return listenerArray.length > 0
  }

  listeners(event: string | symbol): Function[] {
    const listeners = this._events.get(event)
    return listeners ? Array.from(listeners) : []
  }

  rawListeners(event: string | symbol): Function[] {
    return this.listeners(event)
  }

  listenerCount(event: string | symbol): number {
    return this.listeners(event).length
  }

  prependListener(event: string | symbol, listener: Function) {
    // Set 不支持 prepend，简单实现
    return this.on(event, listener)
  }

  prependOnceListener(event: string | symbol, listener: Function) {
    return this.once(event, listener)
  }

  eventNames() {
    return Array.from(this._events.keys())
  }
}

export default EventEmitter
