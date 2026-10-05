export interface StreamConnection {
  close: () => void
  setPaused: (paused: boolean) => void
}

/** Transport contract keeps connection mechanics out of React components. */
export interface StreamClient {
  connect(handlers: {
    onMessage: (message: unknown) => void
    onDisconnect: () => void
    onError: () => void
  }): StreamConnection
}

const SOURCES = ['api-gateway', 'worker-03', 'database-primary', 'edge-proxy']
const METRICS = ['cpu_usage', 'memory_usage', 'request_latency', 'queue_depth']

/** Emits raw payloads and an occasional simulated disconnect to exercise recovery. */
export function createSimulatedStreamClient(options?: {
  intervalMs?: number
  disconnectAfterEvents?: number
}): StreamClient {
  const intervalMs = options?.intervalMs ?? 350
  const disconnectAfterEvents = options?.disconnectAfterEvents ?? 40

  return {
    connect({ onMessage, onDisconnect }) {
      let paused = false
      let closed = false
      let emitted = 0
      let interval: ReturnType<typeof setInterval> | undefined

      const stopInterval = () => {
        if (interval !== undefined) clearInterval(interval)
        interval = undefined
      }

      const startInterval = () => {
        if (closed || paused || interval !== undefined) return

        interval = setInterval(() => {
          emitted += 1
          const value = Number((Math.random() * 100).toFixed(2))
          const status = value > 88 ? 'critical' : value > 70 ? 'warning' : 'healthy'

          onMessage({
            id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${emitted}`,
            timestamp: Date.now(),
            source: SOURCES[Math.floor(Math.random() * SOURCES.length)],
            metric: METRICS[Math.floor(Math.random() * METRICS.length)],
            value,
            status,
          })

          if (emitted >= disconnectAfterEvents) {
            stopInterval()
            onDisconnect()
          }
        }, intervalMs)
      }

      startInterval()

      return {
        close() {
          closed = true
          stopInterval()
        },
        setPaused(value) {
          paused = value
          if (paused) stopInterval()
          else startInterval()
        },
      }
    },
  }
}

export const simulatedStreamClient = createSimulatedStreamClient()
