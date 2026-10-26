import React, { useCallback, useEffect, useRef, useState } from 'react'
import { supabase, isSupabaseConfigured } from './supabaseClient'

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

export default function BlogSite({ theme, onToggleTheme }) {
  const [route, setRoute] = useState(parseBlogRoute())
  const [brand, setBrand] = useState({ brand_tag: 'Engr. Mudi', logo_url: '' })
  const [threads, setThreads] = useState([])
  const [posts, setPosts] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [copied, setCopied] = useState(false)
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

  return (
    <div className={theme === 'light' ? 'page light' : 'page'}>
      <header className="header">
        <div className="header-inner">
          <a className="brand" href="#/">
            {brand.logo_url && <img className="logo" src={brand.logo_url} alt="AXAT logo" />}
            <span className="brand-name">{brand.brand_tag}</span>
          </a>
          <nav className="nav">
            <a href="#software">Software</a>
            <a href="#coaching">Coaching</a>
            <a href="#books">Books</a>
            <a href="#/blog">Blog</a>
            <a href="#hire">Hire me</a>
            <button type="button" className="theme-toggle" onClick={onToggleTheme}>
              {theme === 'light' ? '🌙 Dark mode' : '☀️ Light mode'}
            </button>
          </nav>
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
            <p className="blog-body">{post.body}</p>
            {thread.buy_url && (
              <p className="buy-row">
                <a className="btn" href={thread.buy_url} target="_blank" rel="noreferrer">
                  {thread.buy_label || 'Buy the complete book'}
                </a>
              </p>
            )}
            <p className="buy-row">
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
    </div>
  )
}
