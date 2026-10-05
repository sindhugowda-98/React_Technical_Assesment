import { memo } from 'react'
import { Button } from '../ui'

interface HeaderProps {
  sidebarOpen: boolean
  onToggleSidebar: () => void
}

export const Header = memo(function Header({ sidebarOpen, onToggleSidebar }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="header-brand-group">
        <Button
          className="sidebar-toggle"
          variant="ghost"
          type="button"
          aria-label={sidebarOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={sidebarOpen}
          aria-controls="primary-navigation"
          onClick={onToggleSidebar}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
        </Button>
        <a className="brand" href="#dashboard" aria-label="SignalWatch dashboard">
          <span className="brand-mark" aria-hidden="true">S</span>
          <span className="brand-copy">
            <strong>SignalWatch</strong>
            <small>OPERATIONS CONSOLE</small>
          </span>
        </a>
      </div>
      <div className="header-context">
        <span className="header-context-dot" aria-hidden="true" />
        <span>Infrastructure monitoring</span>
      </div>
    </header>
  )
})
