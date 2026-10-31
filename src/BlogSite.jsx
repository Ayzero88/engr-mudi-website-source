import React, { useCallback, useEffect, useRef, useState } from 'react'
import { supabase, isSupabaseConfigured } from './supabaseClient'
import AyzeroxaChat from './AyzeroxaChat'
import NavMenu from './NavMenu'
import { seedData } from './seedData'

// Hash routes (shareable links, post them anywhere):
//   #/blog                         -> all topics
//   #/blog/<thread-slug>           -> one topic + its posts
//   #/blog/<thread-slug>/<post-slug> -> one post
function parseBlogRoute() {
  const hash = window.location.hash.replace(/^#\/blog\/?/, '')
  const parts = hash ? hash.split('/').map(decodeURIComponent).filter(Boolean) : []
  return { threadSlug: parts[0] || null, postSlug: parts[1] || null }
}

function threadUrl(thread) {
  return `#/blog/${thread.slug}`
}

function postUrl(thread, post) {
  return `#/blog/${thread.slug}/${post.slug}`
}

// Blog bodies are plain text, but a line starting with "IMAGE:" followed
// by a URL renders as an image, so a post can carry diagrams without a
// schema change: e.g. "IMAGE: https://ayzeroxa.com.ng/assets/shape-1.png"
function renderBlogBody(body) {
  return (body || '').split('\n').map((line, i) => {
    const trimmed = line.trim()
    if (trimmed.startsWith('IMAGE:')) {
      const src = trimmed.slice(6).trim()
      return src ? <img key={i} className="blog-image" src={src} alt="" loading="lazy" /> : null
    }
    return <span key={i}>{line}<br /></span>
  })
}

export default function BlogSite({ theme, onToggleTheme }) {
  const [route, setRoute] = useState(parseBlogRoute())
  const [brand, setBrand] = useState({ brand_tag: 'Engr. Mudi', logo_url: '' })
  const [threads, setThreads] = useState([])
  const [posts, setPosts] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [copied, setCopied] = useState(false)
  const [showTop, setShowTop] = useState(false)
  const [reading, setReading] = useState(false)
  // Read-aloud for a blog post: uses the browser's built-in speech, no
  // server or recording. IMAGE: lines are skipped, so only the post text
  // is spoken. Reading stops when the reader leaves the post.
  useEffect(() => {
    return () => { if ('speechSynthesis' in window) window.speechSynthesis.cancel() }
  }, [route.postSlug])
  function toggleReadAloud(post) {
    if (!('speechSynthesis' in window)) return
    if (reading) {
      window.speechSynthesis.cancel()
      setReading(false)
      return
    }
    const text = (post.body || '').split('\n').filter((line) => !line.trim().startsWith('IMAGE:')).join('\n')
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-GB'
    utterance.rate = 1
    utterance.onend = () => setReading(false)
    utterance.onerror = () => setReading(false)
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
    setReading(true)
  }
  // Chat content: live Supabase content when available, so the blog bot
  // updates with admin edits exactly like the main-site bot does.
  const [chatContent, setChatContent] = useState(seedData)
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  const countedRef = useRef(new Set())

  useEffect(() => {
    const onHash = () => setRoute(parseBlogRoute())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const loadBlog = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoaded(true)
      return
    }
    try {
      const [tRes, pRes] = await Promise.all([
        supabase.from('blog_threads').select('*').order('position'),
        supabase.from('blog_posts').select('*').order('day_order'),
      ])
      if (tRes.error) throw tRes.error
      if (pRes.error) throw pRes.error
      setThreads(tRes.data || [])
      // Public reads only return published posts (see RLS policy).
      setPosts(pRes.data || [])
    } catch (e) {
      setLoadError(e.message || 'Could not load the blog.')
    } finally {
      setLoaded(true)
    }
  }, [])

  useEffect(() => {
    loadBlog()
  }, [loadBlog])

  useEffect(() => {
    if (!isSupabaseConfigured) return
    ;(async () => {
      try {
        const results = await Promise.all([
          supabase.from('hero').select('*').eq('id', 1).single(),
          supabase.from('stack_items').select('*').order('position'),
          supabase.from('projects').select('*').order('position'),
          supabase.from('coaching').select('*').eq('id', 1).single(),
          supabase.from('coaching_topics').select('*').order('position'),
          supabase.from('books').select('*').order('position'),
          supabase.from('services').select('*').order('position'),
          supabase.from('social_links').select('*').order('position'),
          supabase.from('hire_text').select('*').eq('id', 1).single(),
        ])
        if (results.some((r) => r.error)) return
        const [hero, stack, projects, coaching, topics, books, services, links, hire] = results.map((r) => r.data)
        let about = seedData.about
        try {
          const { data: aboutRow, error: aboutError } = await supabase.from('about_text').select('*').eq('id', 1).single()
          if (!aboutError && aboutRow) about = aboutRow
        } catch {}
        const pick = (dbValue, seedValue) => {
          if (dbValue == null) return seedValue
          if (Array.isArray(dbValue)) return dbValue.length > 0 ? dbValue : seedValue
          return dbValue
        }
        setChatContent({
          ...seedData,
          about,
          hero: pick(hero, seedData.hero),
          stack: pick(stack, seedData.stack),
          projects: pick(projects, seedData.projects),
          coaching: pick(coaching, seedData.coaching),
          coachingTopics: pick(topics, seedData.coachingTopics),
          books: pick(books, seedData.books),
          services: pick(services, seedData.services),
          socialLinks: pick(links, seedData.socialLinks),
          hire: pick(hire, seedData.hire),
        })
      } catch {}
    })()
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured) return
    supabase
      .from('hero')
      .select('brand_tag,logo_url')
      .eq('id', 1)
      .single()
      .then(({ data }) => {
        if (data) setBrand(data)
      })
      .catch(() => {})
  }, [])

  const thread = route.threadSlug ? threads.find((t) => t.slug === route.threadSlug) : null
  const post = route.postSlug && thread ? posts.find((p) => p.thread_id === thread.id && p.slug === route.postSlug) : null

  // Count one view per post page open (page loads, not unique visitors).
  useEffect(() => {
    if (!post || !isSupabaseConfigured || countedRef.current.has(post.id)) return
    countedRef.current.add(post.id)
    supabase.rpc('increment_post_views', { p_id: post.id }).then(() => {})
  }, [post])

  function copyLink() {
    const url = window.location.href
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 3000)
      }).catch(() => {})
    }
  }

  const otherThreads = thread ? threads.filter((t) => t.id !== thread.id) : threads
  const threadPosts = thread ? posts.filter((p) => p.thread_id === thread.id) : []

  // Home link: the logo and the Home nav item both go to the home page.
  function goHome(e) {
    if (window.location.hash === '#/' || window.location.hash === '') {
      e.preventDefault()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <div className={theme === 'light' ? 'page light' : 'page'}>
      <header className="header">
        <div className="header-inner">
          <a className="brand" href="#/" onClick={goHome} aria-label="Home" title="Home">
            {brand.logo_url && <img className="logo" src={brand.logo_url} alt="AXAT logo" />}
            <span className="brand-name">Ayzeroxa Technologies</span>
          </a>
          <div className="nav-actions">
            <button type="button" className="theme-toggle" onClick={onToggleTheme}>
              {theme === 'light' ? '🌙 Dark mode' : '☀️ Light mode'}
            </button>
            <NavMenu links={[
              { href: '#/', label: 'Home', onClick: goHome },
              { href: '#software', label: 'Software' },
              { href: '#coaching', label: 'Coaching' },
              { href: '#books', label: 'Books' },
              { href: '#/blog', label: 'Blog' },
              { href: '#hire', label: 'Hire us' },
            ]} />
          </div>
        </div>
      </header>

      <main>
        {!loaded && <p>Loading…</p>}
        {loaded && loadError && <p className="error">{loadError}</p>}

        {loaded && !loadError && !thread && (
          <section className="section">
            <h2>Blog</h2>
            {threads.length === 0 ? (
              <p>New posts coming soon — check back shortly.</p>
            ) : (
              <div className="grid">
                {threads.map((t) => {
                  const count = posts.filter((p) => p.thread_id === t.id).length
                  return (
                    <article className="card" key={t.id}>
                      <h3>{t.title}</h3>
                      {t.subject && <p><span className="chip">{t.subject}</span></p>}
                      {t.description && <p>{t.description}</p>}
                      <p>{count === 0 ? 'No posts yet' : `${count} post${count === 1 ? '' : 's'}`}</p>
                      <p><a className="btn" href={threadUrl(t)}>Read →</a></p>
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        )}

        {loaded && !loadError && thread && !post && (
          <section className="section">
            <p><a className="back-link" href="#/blog">← All topics</a></p>
            <h2>{thread.title}</h2>
            {thread.subject && <p><span className="chip">{thread.subject}</span></p>}
            {thread.description && <p>{thread.description}</p>}
            {thread.buy_url && (
              <p className="buy-row">
                <a className="btn" href={thread.buy_url} target="_blank" rel="noreferrer">
                  {thread.buy_label || 'Buy the complete book'}
                </a>
              </p>
            )}
            {threadPosts.length === 0 ? (
              <p>No posts in this topic yet.</p>
            ) : (
              <ul className="post-list">
                {threadPosts.map((p) => (
                  <li key={p.id}><a href={postUrl(thread, p)}>{p.title}</a></li>
                ))}
              </ul>
            )}
            <p className="buy-row">
              <button type="button" className="btn secondary" onClick={copyLink}>
                {copied ? 'Link copied ✓' : 'Copy link'}
              </button>
            </p>
            {otherThreads.length > 0 && (
              <>
                <h3>Other topics</h3>
                <div className="grid">
                  {otherThreads.map((t) => (
                    <article className="card" key={t.id}>
                      <h3>{t.title}</h3>
                      {t.subject && <p><span className="chip">{t.subject}</span></p>}
                      <p><a className="btn secondary" href={threadUrl(t)}>Read →</a></p>
                    </article>
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        {loaded && !loadError && thread && post && (
          <section className="section">
            <p><a className="back-link" href={threadUrl(thread)}>← {thread.title}</a></p>
            <h2>{post.title}</h2>
            {thread.subject && <p><span className="chip">{thread.subject}</span></p>}
            <p className="buy-row">
              <button type="button" className="btn secondary read-btn" onClick={() => toggleReadAloud(post)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10a7 7 0 0 0 14 0" /><path d="M12 19v3" /></svg>
                {reading ? 'Stop reading' : 'Listen'}
              </button>
            </p>
            <div className="blog-body">{renderBlogBody(post.body)}</div>
            {thread.buy_url && (
              <p className="buy-row">
                <a className="btn" href={thread.buy_url} target="_blank" rel="noreferrer">
                  {thread.buy_label || 'Buy the complete book'}
                </a>
              </p>
            )}
            <p className="buy-row">
              <button type="button" className="btn secondary read-btn" onClick={() => toggleReadAloud(post)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10a7 7 0 0 0 14 0" /><path d="M12 19v3" /></svg>
                {reading ? 'Stop reading' : 'Listen'}
              </button>
              <button type="button" className="btn secondary" onClick={copyLink}>
                {copied ? 'Link copied ✓' : 'Copy link'}
              </button>
            </p>
            {threadPosts.filter((p) => p.id !== post.id).length > 0 && (
              <>
                <h3>More in this topic</h3>
                <ul className="post-list">
                  {threadPosts.filter((p) => p.id !== post.id).map((p) => (
                    <li key={p.id}><a href={postUrl(thread, p)}>{p.title}</a></li>
                  ))}
                </ul>
              </>
            )}
            {otherThreads.length > 0 && (
              <>
                <h3>Other topics</h3>
                <div className="grid">
                  {otherThreads.map((t) => (
                    <article className="card" key={t.id}>
                      <h3>{t.title}</h3>
                      {t.subject && <p><span className="chip">{t.subject}</span></p>}
                      <p><a className="btn secondary" href={threadUrl(t)}>Read →</a></p>
                    </article>
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        {loaded && !loadError && route.threadSlug && !thread && (
          <section className="section">
            <h2>Not found</h2>
            <p>This topic does not exist.</p>
            <p><a href="#/blog">← All topics</a></p>
          </section>
        )}
      </main>

      <footer className="footer">
        <p>© {new Date().getFullYear()} Ayzeroxa Technologies. All rights reserved.</p>
      </footer>

      <a className="whatsapp-float" href="https://wa.me/2348075421099" target="_blank" rel="noreferrer" aria-label="WhatsApp" title="WhatsApp"><svg viewBox="0 0 24 24" width="30" height="30" fill="#fff" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2zm5.2 13.9c-.2.6-1.2 1.2-1.7 1.2-.4.1-1 .2-1.6-.1-.4-.2-.9-.4-1.5-.8-2.7-1.1-4.4-3.9-4.6-4.1-.1-.2-1-1.4-1-2.6s.6-1.8.9-2c.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.5s.8 1.9.8 2c.1.1.1.3 0 .5l-.4.6c-.1.2-.3.4-.1.7.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.7-.1l.6-.7c.2-.2.4-.2.6-.1l1.9.9c.2.1.4.2.4.3.1.2.1.7-.1 1.3z"/></svg></a>
      {showTop && (
        <button type="button" className="to-top-float" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Back to top">↑</button>
      )}
      <AyzeroxaChat content={chatContent} />
    </div>
  )
}
