export type EventStatus = 'healthy' | 'warning' | 'critical'

export interface MonitoringEvent {
  id: string
  timestamp: number
  source: string
  metric: string
  value: number
  status: EventStatus
}

export type ConnectionStatus =
  | 'connecting'
  | 'live'
  | 'paused'
  | 'reconnecting'
  | 'error'
