import { useEffect, useId, useRef, useState, type PropsWithChildren } from 'react'
import { Button } from '../Button/Button'

interface MoreOptionsProps extends PropsWithChildren {
  label?: string
}

export function MoreOptions({ children, label = 'More options' }: MoreOptionsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const panelId = useId()

  useEffect(() => {
    if (!isOpen) return
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
        rootRef.current?.querySelector('button')?.focus()
      }
    }
    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [isOpen])

  return (
    <div className="more-options" ref={rootRef}>
      <Button
        className="more-options-trigger"
        variant="ghost"
        type="button"
        aria-label={label}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((open) => !open)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>
      </Button>
      <div className="more-options-panel" id={panelId} hidden={!isOpen}>
        <div role="group" aria-label={label}>{children}</div>
      </div>
    </div>
  )
}
