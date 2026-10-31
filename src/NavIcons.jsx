import React from 'react'

// Small (fine) icons for the header nav links; labels stay visible.
export function navIcon(label) {
  const p = { width: 16, height: 16, fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }
  if (label === 'Home') return (
    <svg viewBox="0 0 24 24" {...p}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /><path d="M9 21v-6h6v6" /></svg>
  )
  if (label === 'About') return (
    <svg viewBox="0 0 24 24" {...p}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
  )
  if (label === 'Software') return (
    <svg viewBox="0 0 24 24" {...p}><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
  )
  if (label === 'Coaching') return (
    <svg viewBox="0 0 24 24" {...p}><path d="M12 3 22 9l-10 6L2 9l10-6z" /><path d="M6 11v4c0 1.5 2.7 3 6 3s6-1.5 6-3v-4" /><path d="M22 9v5" /></svg>
  )
  if (label === 'Books') return (
    <svg viewBox="0 0 24 24" {...p}><path d="M2 5h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2z" /><path d="M22 5h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z" /></svg>
  )
  if (label === 'Blog') return (
    <svg viewBox="0 0 24 24" {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="16" y2="17" /></svg>
  )
  if (label === 'Hire us') return (
    <svg viewBox="0 0 24 24" {...p}><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
  )
  return null
}
