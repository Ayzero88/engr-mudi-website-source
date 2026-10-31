import React, { useEffect, useRef, useState } from 'react'
import { navIcon } from './NavIcons'

// Menu button that opens a dropdown of the nav links.
// links: [{ href, label, onClick? }]
export default function NavMenu({ links }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return undefined
    const onDocClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])
  return (
    <div className="nav-menu" ref={ref}>
      <button type="button" className="menu-button" aria-label="Menu" aria-haspopup="true" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
        Menu
      </button>
      {open && (
        <nav className="menu-dropdown" aria-label="Site menu">
          {links.map((l) => (
            <a key={l.label} href={l.href} onClick={(e) => { if (l.onClick) l.onClick(e); setOpen(false) }}>
              {navIcon(l.label)} {l.label}
            </a>
          ))}
        </nav>
      )}
    </div>
  )
}
