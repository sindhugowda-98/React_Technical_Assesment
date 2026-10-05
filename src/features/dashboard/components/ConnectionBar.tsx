import type { ConnectionStatus } from '../../../types/event'
import { Button } from '../../../shared/ui'

interface ConnectionBarProps {
  status: ConnectionStatus
  onTogglePause: () => void
}

export const ConnectionBar = memo(function ConnectionBar({ status, onTogglePause }: ConnectionBarProps) {
  const canPause = status === 'live' || status === 'paused'

  return (
    <section className="connection-bar" aria-label="Feed controls">
      <p><span className={`status-dot status-dot--${status}`} /> Feed {status}</p>
      {canPause && (
        <Button variant="secondary" onClick={onTogglePause}>
          {status === 'paused' ? 'Resume feed' : 'Pause feed'}
        </Button>
      )}
    </section>
  )
})
import { memo } from 'react'
