import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ConnectionStatus, MonitoringEvent } from '../types/event'
import { parseMonitoringEvent } from '../utils/validate'
import { simulatedStreamClient, type StreamClient, type StreamConnection } from '../services/streamClient'

interface UseLiveStreamOptions {
  bufferSize?: number
  flushIntervalMs?: number
  client?: StreamClient
}

const DEFAULT_BUFFER_SIZE = 200
const DEFAULT_FLUSH_INTERVAL_MS = 250
const MAX_PENDING_EVENTS = 500
const MAX_RECONNECT_DELAY_MS = 10_000

export function useLiveStream({
  bufferSize = DEFAULT_BUFFER_SIZE,
  flushIntervalMs = DEFAULT_FLUSH_INTERVAL_MS,
  client = simulatedStreamClient,
}: UseLiveStreamOptions = {}) {
  const safeBufferSize = Math.max(1, Math.floor(bufferSize))
  const safeFlushInterval = Math.max(50, flushIntervalMs)
  const [events, setEvents] = useState<MonitoringEvent[]>([])
  const [status, setStatus] = useState<ConnectionStatus>('connecting')
  const [totalReceived, setTotalReceived] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [retryGeneration, setRetryGeneration] = useState(0)
  const pendingEvents = useRef<MonitoringEvent[]>([])
  const pendingCount = useRef(0)
  const connection = useRef<StreamConnection | null>(null)
  const pausedRef = useRef(false)

  const togglePause = useCallback(() => {
    const nextPaused = !pausedRef.current
    pausedRef.current = nextPaused
    setIsPaused(nextPaused)
    connection.current?.setPaused(nextPaused)
    setStatus(nextPaused ? 'paused' : connection.current ? 'live' : 'reconnecting')
  }, [])

  const retry = useCallback(() => setRetryGeneration((generation) => generation + 1), [])

  useEffect(() => {
    let disposed = false
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined
    let retryAttempt = 0

    const connect = (isRetry: boolean) => {
      if (disposed) return
      setStatus(isRetry ? 'reconnecting' : 'connecting')

      try {
        connection.current = client.connect({
          onMessage(message) {
            const event = parseMonitoringEvent(message)
            if (!event || disposed || pausedRef.current) return

            if (pendingEvents.current.length === MAX_PENDING_EVENTS) {
              pendingEvents.current.shift()
            }
            pendingEvents.current.push(event)
            pendingCount.current += 1
          },
          onDisconnect() {
            connection.current?.close()
            connection.current = null
            setStatus('reconnecting')
            scheduleReconnect()
          },
          onError() {
            connection.current?.close()
            connection.current = null
            setStatus('error')
            scheduleReconnect()
          },
        })

        if (pausedRef.current) connection.current.setPaused(true)
        else setStatus('live')
      } catch {
        setStatus('error')
        scheduleReconnect()
      }
    }

    const scheduleReconnect = () => {
      if (disposed || pausedRef.current || reconnectTimer !== undefined) return
      const delay = Math.min(500 * 2 ** retryAttempt, MAX_RECONNECT_DELAY_MS)
      retryAttempt += 1
      reconnectTimer = setTimeout(() => {
        reconnectTimer = undefined
        connect(true)
      }, delay)
    }

    connect(false)
    const flushTimer = setInterval(() => {
      if (pendingEvents.current.length === 0) return

      const batch = pendingEvents.current
      const addedCount = pendingCount.current
      pendingEvents.current = []
      pendingCount.current = 0
      setEvents((current) => [...batch].reverse().concat(current).slice(0, safeBufferSize))
      setTotalReceived((current) => current + addedCount)
    }, safeFlushInterval)

    return () => {
      disposed = true
      if (reconnectTimer !== undefined) clearTimeout(reconnectTimer)
      clearInterval(flushTimer)
      connection.current?.close()
      connection.current = null
      pendingEvents.current = []
      pendingCount.current = 0
      pausedRef.current = false
    }
  }, [client, safeBufferSize, safeFlushInterval, retryGeneration])

  const recentRate = useMemo(() => {
    const cutoff = Date.now() - 60_000
    return events.filter((event) => event.timestamp >= cutoff).length
  }, [events])

  return { events, status, isPaused, togglePause, retry, totalReceived, recentRate }
}
