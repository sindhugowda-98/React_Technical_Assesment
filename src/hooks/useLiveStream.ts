import { useCallback, useEffect, useRef, useState } from 'react'
import type { ConnectionStatus, EventStatus, MonitoringEvent } from '../types/event'
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
const RATE_WINDOW_SECONDS = 60
const STATUS_WINDOW_SECONDS = 15 * 60

interface RateBucket { second: number; count: number }
interface StatusBucket extends Record<EventStatus, number> { second: number }
type StatusCount = Record<EventStatus, number>
type StatusCountsByWindow = Record<1 | 5 | 15, StatusCount>

function emptyStatusCount(): StatusCount {
  return { healthy: 0, warning: 0, critical: 0 }
}

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
  const [recentRate, setRecentRate] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [retryGeneration, setRetryGeneration] = useState(0)
  const [statusCountsByWindow, setStatusCountsByWindow] = useState<StatusCountsByWindow>(() => ({
    1: emptyStatusCount(),
    5: emptyStatusCount(),
    15: emptyStatusCount(),
  }))
  const pendingEvents = useRef<MonitoringEvent[]>([])
  const pendingCount = useRef(0)
  const connection = useRef<StreamConnection | null>(null)
  const pausedRef = useRef(false)
  const lastClockSecond = useRef(0)
  const rateBuckets = useRef<RateBucket[]>(Array.from({ length: RATE_WINDOW_SECONDS }, () => ({ second: -1, count: 0 })))
  const statusBuckets = useRef<StatusBucket[]>(Array.from({ length: STATUS_WINDOW_SECONDS }, () => ({ second: -1, healthy: 0, warning: 0, critical: 0 })))

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
    let stableTimer: ReturnType<typeof setTimeout> | undefined
    let retryAttempt = 0

    const clearStableTimer = () => {
      if (stableTimer !== undefined) clearTimeout(stableTimer)
      stableTimer = undefined
    }

    const connect = (isRetry: boolean) => {
      if (disposed) return
      setStatus(isRetry ? 'reconnecting' : 'connecting')

      try {
        connection.current = client.connect({
          onMessage(message) {
            const event = parseMonitoringEvent(message)
            if (!event || disposed || pausedRef.current) return

            const arrivalSecond = Math.floor(Date.now() / 1000)
            const bucket = rateBuckets.current[arrivalSecond % RATE_WINDOW_SECONDS]
            if (bucket.second !== arrivalSecond) {
              bucket.second = arrivalSecond
              bucket.count = 0
            }
            bucket.count += 1
            const eventSecond = Math.floor(event.timestamp / 1000)
            if (eventSecond <= arrivalSecond && arrivalSecond - eventSecond < STATUS_WINDOW_SECONDS) {
              const statusBucket = statusBuckets.current[eventSecond % STATUS_WINDOW_SECONDS]
              if (statusBucket.second !== eventSecond) {
                statusBucket.second = eventSecond
                statusBucket.healthy = 0
                statusBucket.warning = 0
                statusBucket.critical = 0
              }
              statusBucket[event.status] += 1
            }

            if (pendingEvents.current.length === MAX_PENDING_EVENTS) {
              pendingEvents.current.shift()
            }
            pendingEvents.current.push(event)
            pendingCount.current += 1
          },
          onDisconnect() {
            clearStableTimer()
            connection.current?.close()
            connection.current = null
            setStatus('reconnecting')
            scheduleReconnect()
          },
          onError() {
            clearStableTimer()
            connection.current?.close()
            connection.current = null
            setStatus('error')
            scheduleReconnect()
          },
        })

        clearStableTimer()
        stableTimer = setTimeout(() => {
          retryAttempt = 0
          stableTimer = undefined
        }, 30_000)
        if (pausedRef.current) connection.current.setPaused(true)
        else setStatus('live')
      } catch {
        clearStableTimer()
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
      const now = Date.now()
      const currentSecond = Math.floor(now / 1000)
      if (lastClockSecond.current !== currentSecond) {
        lastClockSecond.current = currentSecond
        setCurrentTime(now)
      }
      const oldestSecond = currentSecond - RATE_WINDOW_SECONDS + 1
      const nextRate = rateBuckets.current.reduce((total, bucket) => (
        bucket.second >= oldestSecond && bucket.second <= currentSecond ? total + bucket.count : total
      ), 0)
      const nextStatusCounts: StatusCountsByWindow = { 1: emptyStatusCount(), 5: emptyStatusCount(), 15: emptyStatusCount() }
      for (const bucket of statusBuckets.current) {
        const age = currentSecond - bucket.second
        if (age < 0 || age >= STATUS_WINDOW_SECONDS) continue
        nextStatusCounts[15].healthy += bucket.healthy
        nextStatusCounts[15].warning += bucket.warning
        nextStatusCounts[15].critical += bucket.critical
        if (age < 300) {
          nextStatusCounts[5].healthy += bucket.healthy
          nextStatusCounts[5].warning += bucket.warning
          nextStatusCounts[5].critical += bucket.critical
        }
        if (age < 60) {
          nextStatusCounts[1].healthy += bucket.healthy
          nextStatusCounts[1].warning += bucket.warning
          nextStatusCounts[1].critical += bucket.critical
        }
      }
      setRecentRate((current) => current === nextRate ? current : nextRate)
      setStatusCountsByWindow((current) => {
        const unchanged = ([1, 5, 15] as const).every((window) =>
          current[window].healthy === nextStatusCounts[window].healthy &&
          current[window].warning === nextStatusCounts[window].warning &&
          current[window].critical === nextStatusCounts[window].critical,
        )
        return unchanged ? current : nextStatusCounts
      })
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
      clearStableTimer()
      clearInterval(flushTimer)
      connection.current?.close()
      connection.current = null
      pendingEvents.current = []
      pendingCount.current = 0
      pausedRef.current = false
    }
  }, [client, safeBufferSize, safeFlushInterval, retryGeneration])

  return { events, status, isPaused, togglePause, retry, totalReceived, recentRate, statusCountsByWindow, currentTime }
}
