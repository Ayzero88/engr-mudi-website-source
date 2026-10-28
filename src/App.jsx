import React, { useCallback, useEffect, useState } from 'react'
import PublicSite from './PublicSite'
import BlogSite from './BlogSite'
import AdminPanel from './AdminPanel'
import { supabase } from './supabaseClient'
import { seedData } from './seedData'

function getRoute() {
  const hash = window.location.hash
  // Invite/recovery links land with an access token in the hash: send them
  // to the admin panel, where the session is picked up and a password can be set.
  if (hash === '#/admin' || hash.includes('access_token')) return 'admin'
  if (hash === '#/blog' || hash.startsWith('#/blog/')) return 'blog'
  return 'public'
}

// Use the database value when it has content, otherwise the seed.
function pick(dbValue, seedValue) {
  if (dbValue == null) return seedValue
  if (Array.isArray(dbValue)) return dbValue.length > 0 ? dbValue : seedValue
  return dbValue
}

export default function App() {
  const [route, setRoute] = useState(getRoute())
  const [content, setContent] = useState(seedData)
  const [source, setSource] = useState('seed')
  const [loaded, setLoaded] = useState(false)
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('engr-mudi-theme') || 'dark'
    } catch {
      return 'dark'
    }
  })

  const toggleTheme = () => {
    setTheme((t) => {
      const next = t === 'dark' ? 'light' : 'dark'
      try {
        localStorage.setItem('engr-mudi-theme', next)
      } catch {}
      return next
    })
  }

  const loadContent = useCallback(async () => {
    if (!supabase) {
      setContent(seedData)
      setSource('seed')
      setLoaded(true)
      return
    }
    try {
      const queries = [
        supabase.from('hero').select('*').eq('id', 1).single(),
        supabase.from('stack_items').select('*').order('position'),
        supabase.from('projects').select('*').order('position'),
        supabase.from('coaching').select('*').eq('id', 1).single(),
        supabase.from('coaching_photos').select('*').order('position'),
        supabase.from('coaching_topics').select('*').order('position'),
        supabase.from('books').select('*').order('position'),
        supabase.from('services').select('*').order('position'),
        supabase.from('social_links').select('*').order('position'),
        supabase.from('hire_text').select('*').eq('id', 1).single(),
      ]
      const results = await Promise.all(queries)
      if (results.some((r) => r.error)) throw new Error('Supabase fetch failed')
      const [hero, stack, projects, coaching, photos, topics, books, services, links, hire] =
        results.map((r) => r.data)
      // About loads separately so a missing about_text table (migration not
      // run yet) never breaks the rest of the site — it falls back to seed.
      let about = seedData.about
      try {
        const { data: aboutRow, error: aboutError } = await supabase.from('about_text').select('*').eq('id', 1).single()
        if (!aboutError && aboutRow) about = aboutRow
      } catch {}
      setContent({
        about,
        hero: pick(hero, seedData.hero),
        stack: pick(stack, seedData.stack),
        projects: pick(projects, seedData.projects),
        coaching: pick(coaching, seedData.coaching),
        coachingPhotos: pick(photos, seedData.coachingPhotos),
        coachingTopics: pick(topics, seedData.coachingTopics),
        books: pick(books, seedData.books),
        services: pick(services, seedData.services),
        socialLinks: pick(links, seedData.socialLinks),
        hire: pick(hire, seedData.hire),
      })
      setSource('supabase')
    } catch {
      setContent(seedData)
      setSource('seed')
    } finally {
      setLoaded(true)
    }
  }, [])

  // Light theme affects the public site and the blog; the admin panel stays dark.
  useEffect(() => {
    if (route === 'admin') {
      document.body.classList.remove('light-theme')
    } else {
      document.body.classList.toggle('light-theme', theme === 'light')
    }
  }, [theme, route])

  useEffect(() => {
    const onHash = () => setRoute(getRoute())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // Reload whenever we return to the public view, so admin saves show at once.
  useEffect(() => {
    if (route === 'public') loadContent()
  }, [route, loadContent])

  if (route === 'admin') return <AdminPanel />

  if (route === 'blog') return <BlogSite theme={theme} onToggleTheme={toggleTheme} />

  return (
    <>
      {loaded && source === 'seed' && (
        <p className="source-note">
          Showing starter content — connect Supabase (see README.md) for live editing.
        </p>
      )}
      <PublicSite content={content} theme={theme} onToggleTheme={toggleTheme} />
    </>
  )
}
