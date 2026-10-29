import { supabase, isSupabaseConfigured } from './supabaseClient'

// Site-wide page-view analytics, stored in the owner's own Supabase.
// Privacy: no IP, no user agent, no identity. Only the page path, an
// anonymous random session id kept in the visitor's browser, the
// referrer hostname (if any), and a timestamp. Admin pages are
// never tracked, and a tracking failure never breaks the site.

function getSessionId() {
  try {
    let id = localStorage.getItem('ayzeroxa-session')
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36)
      localStorage.setItem('ayzeroxa-session', id)
    }
    return id
  } catch {
    return 'unknown'
  }
}

export function getPagePath() {
  const hash = window.location.hash
  if (hash === '#/admin' || hash.includes('access_token')) return null
  if (hash === '#/blog' || hash.startsWith('#/blog/')) {
    return hash.slice(1) || '/blog'
  }
  return '/'
}

function referrerHost() {
  try {
    if (!document.referrer) return ''
    const host = new URL(document.referrer).hostname
    return host === window.location.hostname ? '' : host
  } catch {
    return ''
  }
}

export function trackPageView() {
  if (!isSupabaseConfigured || !supabase) return
  const page = getPagePath()
  if (!page) return
  supabase
    .from('site_page_views')
    .insert({ page, session_id: getSessionId(), referrer: referrerHost() })
    .then(() => {})
    .catch(() => {})
}
