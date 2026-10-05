import { memo } from 'react'

export const Footer = memo(function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-inner">
        <span className="footer-brand">SignalWatch</span>
        <span className="footer-description">Live operations dashboard</span>
        <span className="footer-feed"><span aria-hidden="true" />Simulated data feed</span>
      </div>
    </footer>
  )
})
