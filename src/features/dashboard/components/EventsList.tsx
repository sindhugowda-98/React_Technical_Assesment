import { memo, useMemo, useState } from 'react'
import type { MonitoringEvent } from '../../../types/event'
import { MoreOptions, Option, Select, Table, type TableColumn } from '../../../shared/ui'

type SortKey = 'time' | 'source' | 'metric' | 'value' | 'status'
type SortableEventColumn = TableColumn<MonitoringEvent> & { sortValue: (event: MonitoringEvent) => string | number }

const columns: SortableEventColumn[] = [
  { key: 'time', header: 'Time', render: (event) => new Date(event.timestamp).toLocaleTimeString(), sortValue: (event) => event.timestamp },
  { key: 'source', header: 'Source', render: (event) => event.source, sortValue: (event) => event.source.toLowerCase() },
  { key: 'metric', header: 'Metric', render: (event) => event.metric.replaceAll('_', ' '), sortValue: (event) => event.metric },
  { key: 'value', header: 'Value', render: (event) => event.value.toFixed(1), sortValue: (event) => event.value },
  { key: 'status', header: 'Status', render: (event) => <span className={`status-label status-label--${event.status}`}>{event.status}</span>, sortValue: (event) => event.status },
]

interface EventsListProps { events: MonitoringEvent[] }

export const EventsList = memo(function EventsList({ events }: EventsListProps) {
  const [source, setSource] = useState('all')
  const [metric, setMetric] = useState('all')
  const [status, setStatus] = useState('all')
  const [sortKey, setSortKey] = useState<SortKey>('time')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const sources = useMemo(() => [...new Set(events.map((event) => event.source))].sort(), [events])
  const metrics = useMemo(() => [...new Set(events.map((event) => event.metric))].sort(), [events])

  const filteredEvents = useMemo(() => {
    const filtered = events.filter((event) =>
      (source === 'all' || event.source === source) &&
      (metric === 'all' || event.metric === metric) &&
      (status === 'all' || event.status === status),
    )
    const column = columns.find((item) => item.key === sortKey)
    const multiplier = sortDirection === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => {
      const left = column?.sortValue(a) ?? ''
      const right = column?.sortValue(b) ?? ''
      return (typeof left === 'number' && typeof right === 'number'
        ? left - right
        : String(left).localeCompare(String(right))) * multiplier
    })
  }, [events, source, metric, status, sortKey, sortDirection])

  return (
    <section className="panel events-panel" id="events" aria-labelledby="events-title">
      <div className="panel-heading events-heading">
        <div><h2 id="events-title">Recent events</h2><p>Latest events from the feed</p></div>
        <div className="events-actions">
          <span className="events-count">{filteredEvents.length} of {events.length} events</span>
          <MoreOptions label="Event filters and sorting">
            <p className="dropdown-heading">Filter events</p>
            <div className="dropdown-fields">
              <Select id="event-source" label="Source" value={source} onChange={setSource}>
                <Option value="all">All sources</Option>
                {sources.map((item) => <Option key={item} value={item}>{item}</Option>)}
              </Select>
              <Select id="event-metric" label="Metric" value={metric} onChange={setMetric}>
                <Option value="all">All metrics</Option>
                {metrics.map((item) => <Option key={item} value={item}>{item.replaceAll('_', ' ')}</Option>)}
              </Select>
              <Select id="event-status" label="Status" value={status} onChange={setStatus}>
                <Option value="all">All statuses</Option>
                <Option value="healthy">Healthy</Option>
                <Option value="warning">Warning</Option>
                <Option value="critical">Critical</Option>
              </Select>
            </div>
            <div className="dropdown-divider" />
            <p className="dropdown-heading">Sort events</p>
            <div className="dropdown-fields dropdown-fields--sort">
              <Select id="event-sort-field" label="Sort by" value={sortKey} onChange={(value) => setSortKey(value as SortKey)}>
                {columns.map((column) => <Option key={column.key} value={column.key}>{column.header}</Option>)}
              </Select>
              <Select id="event-sort-order" label="Order" value={sortDirection} onChange={(value) => setSortDirection(value as 'asc' | 'desc')}>
                <Option value="desc">Descending</Option>
                <Option value="asc">Ascending</Option>
              </Select>
            </div>
          </MoreOptions>
        </div>
      </div>
      <Table columns={columns} rows={filteredEvents} getRowKey={(event) => event.id} sortKey={sortKey} sortDirection={sortDirection} emptyMessage="No events match these filters." />
    </section>
  )
})
