import React, { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from './supabaseClient'

const BUCKET = 'site-images'

// ---------- small helpers ----------

async function uploadImage(file) {
  const path = `${Date.now()}-${file.name}`.replace(/\s+/g, '-')
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true })
  if (error) throw error
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

function moveInList(list, index, dir) {
  const next = [...list]
  const target = index + dir
  if (target < 0 || target >= next.length) return next
  ;[next[index], next[target]] = [next[target], next[index]]
  return next.map((row, i) => ({ ...row, position: i + 1 }))
}

async function persistPositions(table, rows) {
  for (const row of rows) {
    await supabase.from(table).update({ position: row.position }).eq('id', row.id)
  }
}

// ---------- form bits ----------

function TextField({ label, value, onChange, textarea, rows }) {
  return (
    <label className="field">
      <span>{label}</span>
      {textarea ? (
        <textarea value={value || ''} onChange={(e) => onChange(e.target.value)} rows={rows || 3} />
      ) : (
        <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  )
}

function ImageField({ label, value, onChange }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  return (
    <div className="field">
      <span>{label}</span>
      {value && <img className="thumb" src={value} alt="preview" />}
      <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder="Image URL" />
      <input
        type="file"
        accept="image/*"
        onChange={async (e) => {
          const file = e.target.files && e.target.files[0]
          if (!file) return
          setBusy(true)
          setErr('')
          try {
            onChange(await uploadImage(file))
          } catch (ex) {
            setErr(ex.message || 'Upload failed')
          }
          setBusy(false)
        }}
      />
      {busy && <span>Uploading…</span>}
      {err && <span className="error">{err}</span>}
    </div>
  )
}

// Save button that shows its own loading state: "Saving…" + disabled
// while the save runs, back to "Save" when it finishes. The existing
// "Saved ✓" banner still appears on success; errors still alert.
function SaveButton({ onSave, className, children }) {
  const [saving, setSaving] = useState(false)
  return (
    <button
      className={className}
      disabled={saving}
      onClick={async () => {
        setSaving(true)
        try {
          await onSave()
        } catch (e) {
          alert(e.message)
        } finally {
          setSaving(false)
        }
      }}
    >
      {saving ? 'Saving…' : children}
    </button>
  )
}

// ---------- admin panel ----------

export default function AdminPanel() {
  const [session, setSession] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPassword2, setNewPassword2] = useState('')
  const [pwMsg, setPwMsg] = useState('')
  const [data, setData] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [saved, setSaved] = useState('')
  const [blogThreads, setBlogThreads] = useState([])
  const [blogPosts, setBlogPosts] = useState([])
  const [blogError, setBlogError] = useState('')
  const [blogThreadFilter, setBlogThreadFilter] = useState('')
  const [aboutError, setAboutError] = useState('')
  const [siteViews, setSiteViews] = useState(null)
  const [siteViewsError, setSiteViewsError] = useState('')

  useEffect(() => {
    if (!isSupabaseConfigured) return
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      setAuthChecked(true)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session) { loadAll(); loadBlog(); loadSiteViews() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  async function loadAll() {
    // Single-row tables (hero, coaching, hire_text) have no position column,
    // so they must not be ordered by it — only the list tables get an order.
    const singleTables = ['hero', 'coaching', 'hire_text']
    const listTables = ['stack_items', 'projects', 'coaching_photos', 'coaching_topics', 'books', 'services', 'social_links']
    const results = await Promise.all([
      ...singleTables.map((t) => supabase.from(t).select('*')),
      ...listTables.map((t) => supabase.from(t).select('*').order('position', { ascending: true })),
    ])
    const failed = results.find((r) => r.error)
    if (failed) {
      setLoadError(failed.error.message)
      return
    }
    const [hero, coaching, hire, stack, projects, photos, topics, books, services, links] = results.map((r) => r.data)
    setData({
      hero: hero[0] || {},
      about: { body: 'Ayzeroxa Technologies builds software and tutors people from no tech background to fullstack developers. We started in 2023, and our founder is Osemudiamen Ayo-Okhiria.' },
      stack,
      projects,
      coaching: coaching[0] || {},
      photos,
      topics,
      books,
      services,
      links,
      hire: hire[0] || {},
    })
    // About loads separately: if the about_text table does not exist yet
    // (migration not run), the rest of the panel still works.
    try {
      const { data: aboutRow, error: aboutErr } = await supabase.from('about_text').select('*').eq('id', 1).single()
      if (aboutErr) {
        setAboutError('About table not found yet — run supabase/migration-about.sql in the Supabase SQL editor, then refresh this page.')
      } else if (aboutRow) {
        setAboutError('')
        setData((d) => ({ ...d, about: aboutRow }))
      }
    } catch {
      setAboutError('About could not load — run supabase/migration-about.sql in the Supabase SQL editor, then refresh this page.')
    }
  }

  // ---------- blog (separate state: a blog-table problem must never
  // break the rest of the admin panel) ----------

  function slugify(text) {
    return (text || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  async function loadBlog() {
    const [tRes, pRes] = await Promise.all([
      supabase.from('blog_threads').select('*').order('position'),
      supabase.from('blog_posts').select('*').order('day_order'),
    ])
    if (tRes.error || pRes.error) {
      setBlogError((tRes.error || pRes.error).message)
      return
    }
    setBlogThreads(tRes.data || [])
    setBlogPosts(pRes.data || [])
    setBlogError('')
  }

  // ---------- site-wide analytics (separate state, same pattern) ----------

  async function loadSiteViews() {
    const { data, error } = await supabase
      .from('site_page_views')
      .select('page,session_id,viewed_at')
      .order('viewed_at', { ascending: false })
      .limit(5000)
    if (error) {
      setSiteViewsError('Site analytics table not found yet — run supabase/migration-analytics.sql in the Supabase SQL editor, then refresh this page.')
      setSiteViews(null)
      return
    }
    setSiteViewsError('')
    setSiteViews(data || [])
  }

  function updateBlog(kind, id, patch) {
    if (kind === 'thread') {
      setBlogThreads((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)))
    } else {
      setBlogPosts((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)))
    }
  }

  async function saveBlogRow(table, row, kind) {
    const toSave = { ...row, slug: (row.slug || '').trim() || slugify(row.title) }
    let result
    if (String(row.id).startsWith('new-')) {
      const { id, ...rest } = toSave
      result = await supabase.from(table).insert(rest).select().single()
    } else {
      result = await supabase.from(table).update(toSave).eq('id', row.id).select().single()
    }
    if (result.error) throw result.error
    const savedRow = result.data
    if (kind === 'thread') {
      setBlogThreads((rows) => (rows.some((r) => r.id === row.id) ? rows.map((r) => (r.id === row.id ? savedRow : r)) : [...rows, savedRow]))
    } else {
      setBlogPosts((rows) => (rows.some((r) => r.id === row.id) ? rows.map((r) => (r.id === row.id ? savedRow : r)) : [...rows, savedRow]))
    }
    flash('Saved ✓')
  }

  async function deleteBlogThread(id) {
    if (!window.confirm('Delete this topic and all its posts?')) return
    const { error } = await supabase.from('blog_threads').delete().eq('id', id)
    if (error) { alert(error.message); return }
    setBlogThreads((rows) => rows.filter((r) => r.id !== id))
    setBlogPosts((rows) => rows.filter((r) => r.thread_id !== id))
    flash('Deleted ✓')
  }

  async function deleteBlogPost(id) {
    if (!window.confirm('Delete this post?')) return
    const { error } = await supabase.from('blog_posts').delete().eq('id', id)
    if (error) { alert(error.message); return }
    setBlogPosts((rows) => rows.filter((r) => r.id !== id))
    flash('Deleted ✓')
  }

  async function moveBlogThread(index, dir) {
    const next = moveInList(blogThreads, index, dir)
    setBlogThreads(next)
    await persistPositions('blog_threads', next)
    flash('Saved ✓')
  }

  function addBlogThread() {
    setBlogThreads((rows) => [...rows, { id: `new-${Date.now()}`, position: rows.length + 1, title: '', subject: '', slug: '', description: '', buy_label: '', buy_url: '' }])
  }

  function addBlogPost() {
    const threadId = blogThreadFilter || (blogThreads[0] && blogThreads[0].id)
    if (!threadId) { alert('Add a topic first, then add posts to it.'); return }
    const inThread = blogPosts.filter((p) => p.thread_id === threadId)
    const dayOrder = inThread.reduce((m, p) => Math.max(m, p.day_order || 0), 0) + 1
    setBlogPosts((rows) => [...rows, { id: `new-${Date.now()}`, thread_id: threadId, title: '', slug: '', body: '', day_order: dayOrder, published: true }])
  }

  function flash(message) {
    setSaved(message)
    setTimeout(() => setSaved(''), 3000)
  }

  async function saveSingle(table, row) {
    const { error } = await supabase.from(table).upsert(row)
    if (error) throw error
    flash('Saved ✓')
  }

  async function saveRow(table, row, listKey) {
    let result
    if (String(row.id).startsWith('new-')) {
      const { id, ...rest } = row
      result = await supabase.from(table).insert(rest).select().single()
    } else {
      result = await supabase.from(table).update(row).eq('id', row.id).select().single()
    }
    if (result.error) throw result.error
    if (listKey) {
      setData((d) => ({
        ...d,
        [listKey]: d[listKey].map((r) => (r.id === row.id ? result.data : r)),
      }))
    }
    flash('Saved ✓')
  }

  async function deleteRow(table, id, listKey) {
    if (!window.confirm('Delete this item?')) return
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) {
      alert(error.message)
      return
    }
    setData((d) => ({ ...d, [listKey]: d[listKey].filter((r) => r.id !== id) }))
    flash('Deleted ✓')
  }

  async function reorder(table, listKey, index, dir) {
    const next = moveInList(data[listKey], index, dir)
    setData((d) => ({ ...d, [listKey]: next }))
    await persistPositions(table, next)
    flash('Saved ✓')
  }

  function updateList(listKey, id, patch) {
    setData((d) => ({
      ...d,
      [listKey]: d[listKey].map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }))
  }

  function addRow(listKey, blank) {
    const row = { id: `new-${Date.now()}`, position: data[listKey].length + 1, ...blank }
    setData((d) => ({ ...d, [listKey]: [...d[listKey], row] }))
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="admin">
        <h1>Manage website</h1>
        <p className="error">
          Supabase is not connected yet. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
          (see README.md), redeploy, then open this panel again.
        </p>
        <p><a href="#/">← Back to site</a></p>
      </div>
    )
  }

  if (!authChecked) return <div className="admin"><p>Loading…</p></div>

  if (!session) {
    return (
      <div className="admin login-box">
        <h1>Manage website</h1>
        <p>Sign in with the owner account created in Supabase Auth.</p>
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            setAuthError('')
            const { error } = await supabase.auth.signInWithPassword({ email, password })
            if (error) setAuthError(error.message)
          }}
        >
          <label className="field"><span>Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className="field"><span>Password</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          <button className="btn" type="submit">Sign in</button>
          {authError && <p className="error">{authError}</p>}
        </form>
        <p className="hint">First time here? Accept the invitation email first — that is where your admin password is set. The database password is a different thing and will not work here.</p>
        <p><a href="#/">← Back to site</a></p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="admin">
        <h1>Manage website</h1>
        <p className="error">Could not load content: {loadError}</p>
        <p>Check that schema.sql and seed.sql have been run in Supabase.</p>
      </div>
    )
  }

  if (!data) return <div className="admin"><p>Loading content…</p></div>

  return (
    <div className="admin">
      <header className="admin-head">
        <h1>Manage website</h1>
        <div>
          <a className="btn secondary" href="#/">View site</a>{' '}
          <button className="btn secondary" onClick={() => supabase.auth.signOut()}>Sign out</button>
        </div>
      </header>
      {saved && <p className="saved">{saved}</p>}
      <p className="hint">Changes save to Supabase and show on the public site right away.</p>

      {/* Admin password */}
      <section className="panel-section">
        <h2>Admin password</h2>
        <p className="hint">Set this once after accepting the invitation email. Afterwards you can sign in with your email and this password.</p>
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            setPwMsg('')
            if (newPassword !== newPassword2) { setPwMsg('Passwords do not match'); return }
            if (newPassword.length < 6) { setPwMsg('Use at least 6 characters'); return }
            const { error } = await supabase.auth.updateUser({ password: newPassword })
            setPwMsg(error ? error.message : 'Password saved ✓ — you can now sign in with email + password.')
          }}
        >
          <label className="field"><span>New password</span>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
          </label>
          <label className="field"><span>Confirm new password</span>
            <input type="password" value={newPassword2} onChange={(e) => setNewPassword2(e.target.value)} required />
          </label>
          <button className="btn" type="submit">Save password</button>
          {pwMsg && <p className="hint">{pwMsg}</p>}
        </form>
      </section>

      {/* Hero */}
      <section className="panel-section">
        <h2>Hero</h2>
        <TextField label="Full name" value={data.hero.full_name} onChange={(v) => setData((d) => ({ ...d, hero: { ...d.hero, full_name: v } }))} />
        <TextField label="Hero brand tag" value={data.hero.brand_tag} onChange={(v) => setData((d) => ({ ...d, hero: { ...d.hero, brand_tag: v } }))} />
        <TextField label="Shorts link label" value={data.hero.shorts_label} onChange={(v) => setData((d) => ({ ...d, hero: { ...d.hero, shorts_label: v } }))} />
        <TextField label="Shorts link URL" value={data.hero.shorts_url} onChange={(v) => setData((d) => ({ ...d, hero: { ...d.hero, shorts_url: v } }))} />
        <ImageField label="Logo" value={data.hero.logo_url} onChange={(v) => setData((d) => ({ ...d, hero: { ...d.hero, logo_url: v } }))} />
        <SaveButton className="btn" onSave={() => saveSingle('hero', data.hero)}>Save hero</SaveButton>
      </section>

      {/* About */}
      <section className="panel-section">
        <h2>About</h2>
        <p className="hint">This is the About section on the public site, and the Ayzeroxa bot also answers from it.</p>
        {aboutError && <p className="error">{aboutError}</p>}
        <TextField label="About text" textarea rows={5} value={data.about && data.about.body} onChange={(v) => setData((d) => ({ ...d, about: { ...(d.about || {}), body: v } }))} />
        <SaveButton className="btn" onSave={() => saveSingle('about_text', data.about)}>Save about</SaveButton>
      </section>

      {/* Stack */}
      <section className="panel-section">
        <h2>Stack</h2>
        {data.stack.map((row, i) => (
          <div className="row" key={row.id}>
            <input type="text" value={row.label} onChange={(e) => updateList('stack', row.id, { label: e.target.value })} />
            <SaveButton onSave={() => saveRow('stack_items', row)}>Save</SaveButton>
            <button onClick={() => reorder('stack_items', 'stack', i, -1)}>↑</button>
            <button onClick={() => reorder('stack_items', 'stack', i, 1)}>↓</button>
            <button onClick={() => deleteRow('stack_items', row.id, 'stack')}>Delete</button>
          </div>
        ))}
        <button className="btn secondary" onClick={() => addRow('stack', { label: '' })}>+ Add stack item</button>
      </section>

      {/* Projects */}
      <section className="panel-section">
        <h2>Projects</h2>
        {data.projects.map((row, i) => (
          <div className="card-edit" key={row.id}>
            {/* Save at the top too, so a long project card never hides it
                below the Screenshot field. Same save as the bottom button. */}
            <div className="row">
              <SaveButton onSave={() => saveRow('projects', row)}>Save</SaveButton>
              <span className="hint">{row.title || '(new project)'}</span>
            </div>
            <TextField label="Title" value={row.title} onChange={(v) => updateList('projects', row.id, { title: v })} />
            <TextField label="Tagline (optional)" value={row.tagline} onChange={(v) => updateList('projects', row.id, { tagline: v })} />
            <TextField label="Description" textarea value={row.description} onChange={(v) => updateList('projects', row.id, { description: v })} />
            <label className="field"><span>Status</span>
              <select value={row.status} onChange={(e) => updateList('projects', row.id, { status: e.target.value })}>
                <option value="LIVE">LIVE</option>
                <option value="Coming Soon">Coming Soon</option>
              </select>
            </label>
            <ImageField label="Screenshot" value={row.image_url} onChange={(v) => updateList('projects', row.id, { image_url: v })} />
            <div className="row">
              <SaveButton onSave={() => saveRow('projects', row)}>Save</SaveButton>
              <button onClick={() => reorder('projects', 'projects', i, -1)}>↑</button>
              <button onClick={() => reorder('projects', 'projects', i, 1)}>↓</button>
              <button onClick={() => deleteRow('projects', row.id, 'projects')}>Delete</button>
            </div>
          </div>
        ))}
        <button className="btn secondary" onClick={() => addRow('projects', { title: '', description: '', tagline: '', status: 'Coming Soon', image_url: '/assets/weighing-coming-soon.svg' })}>+ Add project</button>
      </section>

      {/* Coaching */}
      <section className="panel-section">
        <h2>Coaching</h2>
        <TextField label="Coaching text" textarea value={data.coaching.body} onChange={(v) => setData((d) => ({ ...d, coaching: { ...d.coaching, body: v } }))} />
        <TextField label="Current training note (highlighted box — leave blank to hide it)" textarea value={data.coaching.note} onChange={(v) => setData((d) => ({ ...d, coaching: { ...d.coaching, note: v } }))} />
        <SaveButton className="btn" onSave={() => saveSingle('coaching', data.coaching)}>Save coaching text</SaveButton>
        <h3>What we coach</h3>
        {data.topics.map((row, i) => (
          <div className="row" key={row.id}>
            <input type="text" value={row.label} onChange={(e) => updateList('topics', row.id, { label: e.target.value })} />
            <SaveButton onSave={() => saveRow('coaching_topics', row)}>Save</SaveButton>
            <button onClick={() => reorder('coaching_topics', 'topics', i, -1)}>↑</button>
            <button onClick={() => reorder('coaching_topics', 'topics', i, 1)}>↓</button>
            <button onClick={() => deleteRow('coaching_topics', row.id, 'topics')}>Delete</button>
          </div>
        ))}
        <button className="btn secondary" onClick={() => addRow('topics', { label: '' })}>+ Add topic</button>
        <h3>Photos</h3>
        {data.photos.map((row, i) => (
          <div className="card-edit" key={row.id}>
            <ImageField label="Photo" value={row.image_url} onChange={(v) => updateList('photos', row.id, { image_url: v })} />
            <TextField label="Caption" value={row.caption} onChange={(v) => updateList('photos', row.id, { caption: v })} />
            <div className="row">
              <SaveButton onSave={() => saveRow('coaching_photos', row)}>Save</SaveButton>
              <button onClick={() => reorder('coaching_photos', 'photos', i, -1)}>↑</button>
              <button onClick={() => reorder('coaching_photos', 'photos', i, 1)}>↓</button>
              <button onClick={() => deleteRow('coaching_photos', row.id, 'photos')}>Delete</button>
            </div>
          </div>
        ))}
        <button className="btn secondary" onClick={() => addRow('photos', { image_url: '', caption: '' })}>+ Add photo</button>
      </section>

      {/* Books */}
      <section className="panel-section">
        <h2>Books</h2>
        {data.books.map((row, i) => (
          <div className="card-edit" key={row.id}>
            <TextField label="Title" value={row.title} onChange={(v) => updateList('books', row.id, { title: v })} />
            <TextField label="Description" textarea value={row.description} onChange={(v) => updateList('books', row.id, { description: v })} />
            <TextField label="Price label (e.g. ₦2,500)" value={row.price_label} onChange={(v) => updateList('books', row.id, { price_label: v })} />
            <TextField label="Buy on Selar URL (blank = no button)" value={row.selar_url} onChange={(v) => updateList('books', row.id, { selar_url: v })} />
            <TextField label="Buy on Paystack URL (blank = no button)" value={row.paystack_url} onChange={(v) => updateList('books', row.id, { paystack_url: v })} />
            <label className="field"><span>
              <input type="checkbox" checked={!!row.coming_soon} onChange={(e) => updateList('books', row.id, { coming_soon: e.target.checked })} />
              {' '}Coming soon (no buy buttons)
            </span></label>
            <div className="row">
              <SaveButton onSave={() => saveRow('books', row)}>Save</SaveButton>
              <button onClick={() => reorder('books', 'books', i, -1)}>↑</button>
              <button onClick={() => reorder('books', 'books', i, 1)}>↓</button>
              <button onClick={() => deleteRow('books', row.id, 'books')}>Delete</button>
            </div>
          </div>
        ))}
        <button className="btn secondary" onClick={() => addRow('books', { title: '', description: '', price_label: '', selar_url: '', paystack_url: '', coming_soon: false })}>+ Add book</button>
      </section>

      {/* Blog */}
      <section className="panel-section">
        <h2>Blog</h2>
        {blogError && <p className="error">Blog could not load: {blogError}</p>}
        <p className="hint">Topics group posts — one topic per book or subject. Posts are pasted here as plain text and line breaks are kept. Nothing shows on the public blog until you add it here.</p>
        <h3>Topics</h3>
        {blogThreads.map((row, i) => (
          <div className="card-edit" key={row.id}>
            <TextField label="Topic title (e.g. Prepare for WAEC Mathematics in 30 Days)" value={row.title} onChange={(v) => updateBlog('thread', row.id, { title: v })} />
            <TextField label="Subject (e.g. Mathematics)" value={row.subject} onChange={(v) => updateBlog('thread', row.id, { subject: v })} />
            <TextField label="Description" textarea value={row.description} onChange={(v) => updateBlog('thread', row.id, { description: v })} />
            <TextField label="Buy button label (blank = “Buy the complete book”)" value={row.buy_label} onChange={(v) => updateBlog('thread', row.id, { buy_label: v })} />
            <TextField label="Buy URL — Selar or Paystack link (blank = no button)" value={row.buy_url} onChange={(v) => updateBlog('thread', row.id, { buy_url: v })} />
            <TextField label="Slug — web address part (blank = filled from the title when you save)" value={row.slug} onChange={(v) => updateBlog('thread', row.id, { slug: v })} />
            <div className="row">
              <SaveButton onSave={() => saveBlogRow('blog_threads', row, 'thread')}>Save</SaveButton>
              <button onClick={() => moveBlogThread(i, -1)}>↑</button>
              <button onClick={() => moveBlogThread(i, 1)}>↓</button>
              <button onClick={() => deleteBlogThread(row.id)}>Delete</button>
            </div>
          </div>
        ))}
        <button className="btn secondary" onClick={addBlogThread}>+ Add topic</button>

        <h3>Posts</h3>
        <label className="field"><span>Show posts for</span>
          <select value={blogThreadFilter} onChange={(e) => setBlogThreadFilter(e.target.value)}>
            <option value="">All topics</option>
            {blogThreads.map((t) => (
              <option key={t.id} value={t.id}>{t.title || '(untitled topic)'}</option>
            ))}
          </select>
        </label>
        {(blogThreadFilter ? blogPosts.filter((p) => p.thread_id === blogThreadFilter) : blogPosts).map((row) => (
          <div className="card-edit" key={row.id}>
            <label className="field"><span>Topic</span>
              <select value={row.thread_id} onChange={(e) => updateBlog('post', row.id, { thread_id: e.target.value })}>
                {blogThreads.map((t) => (
                  <option key={t.id} value={t.id}>{t.title || '(untitled topic)'}</option>
                ))}
              </select>
            </label>
            <TextField label="Post title (e.g. Day 1: Indices and Logarithms)" value={row.title} onChange={(v) => updateBlog('post', row.id, { title: v })} />
            <TextField label="Slug (blank = filled from the title when you save)" value={row.slug} onChange={(v) => updateBlog('post', row.id, { slug: v })} />
            <label className="field"><span>Day / order number</span>
              <input type="number" value={row.day_order} onChange={(e) => updateBlog('post', row.id, { day_order: parseInt(e.target.value, 10) || 0 })} />
            </label>
            <TextField label="Body — paste the full post text here" textarea rows={12} value={row.body} onChange={(v) => updateBlog('post', row.id, { body: v })} />
            <label className="field"><span>
              <input type="checkbox" checked={!!row.published} onChange={(e) => updateBlog('post', row.id, { published: e.target.checked })} />
              {' '}Published (uncheck to hide from the public blog)
            </span></label>
            <div className="row">
              <SaveButton onSave={() => saveBlogRow('blog_posts', row, 'post')}>Save</SaveButton>
              <button onClick={() => deleteBlogPost(row.id)}>Delete</button>
              <span className="hint">{row.views || 0} views</span>
            </div>
          </div>
        ))}
        <button className="btn secondary" onClick={addBlogPost}>+ Add post</button>

        <h3>Metrics</h3>
        <p className="hint">Views count page loads on a post, not unique visitors.</p>
        <button className="btn secondary" onClick={loadBlog}>Refresh metrics</button>
        {(() => {
          const totalViews = blogPosts.reduce((s, p) => s + (p.views || 0), 0)
          const publishedCount = blogPosts.filter((p) => p.published).length
          const perThread = blogThreads.map((t) => {
            const tPosts = blogPosts.filter((p) => p.thread_id === t.id)
            return { thread: t, posts: tPosts.length, published: tPosts.filter((p) => p.published).length, views: tPosts.reduce((s, p) => s + (p.views || 0), 0) }
          })
          const maxViews = Math.max(1, ...perThread.map((r) => r.views))
          return (
            <>
              <div className="metric-grid">
                <div className="metric-card"><div className="metric-num">{blogThreads.length}</div><div>Topics</div></div>
                <div className="metric-card"><div className="metric-num">{blogPosts.length}</div><div>Posts</div></div>
                <div className="metric-card"><div className="metric-num">{publishedCount}</div><div>Published</div></div>
                <div className="metric-card"><div className="metric-num">{totalViews}</div><div>Total views</div></div>
              </div>
              <h3>Views by topic</h3>
              {perThread.length === 0 ? <p className="hint">No topics yet.</p> : perThread.map((r) => (
                <div className="bar-row" key={r.thread.id}>
                  <span>{r.thread.title || '(untitled topic)'} — {r.views} views · {r.posts} posts ({r.published} published)</span>
                  <div className="bar-track"><span className="bar-fill" style={{ width: `${Math.round((r.views / maxViews) * 100)}%` }} /></div>
                </div>
              ))}
              <h3>Views by post</h3>
              {blogPosts.length === 0 ? <p className="hint">No posts yet.</p> : (
                <table className="metric-table">
                  <thead><tr><th>Post</th><th>Topic</th><th>Views</th><th>Status</th></tr></thead>
                  <tbody>
                    {blogPosts.map((p) => (
                      <tr key={p.id}>
                        <td>{p.title || '(untitled)'}</td>
                        <td>{(blogThreads.find((t) => t.id === p.thread_id) || {}).title || '—'}</td>
                        <td>{p.views || 0}</td>
                        <td>{p.published ? 'Published' : 'Draft'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )
        })()}
      </section>

      {/* Site-wide analytics */}
      <section className="panel-section">
        <h2>Site analytics</h2>
        <p className="hint">Page views across the whole site (home, blog pages, and any other route). Counts page loads, not unique visitors — the “unique visitors” figure counts distinct anonymous browser sessions. Admin pages are never tracked, and no IP addresses or personal data are collected.</p>
        <button className="btn secondary" onClick={loadSiteViews}>Refresh site analytics</button>
        {siteViewsError ? <p className="hint">{siteViewsError}</p> : siteViews === null ? <p className="hint">Loading…</p> : (() => {
          const total = siteViews.length
          const unique = new Set(siteViews.map((v) => v.session_id)).size
          const today = new Date().toISOString().slice(0, 10)
          const todayViews = siteViews.filter((v) => (v.viewed_at || '').slice(0, 10) === today).length
          const byPage = {}
          siteViews.forEach((v) => { byPage[v.page] = (byPage[v.page] || 0) + 1 })
          const pageRows = Object.entries(byPage).sort((a, b) => b[1] - a[1])
          const maxPage = Math.max(1, ...pageRows.map((r) => r[1]))
          const byDay = {}
          siteViews.forEach((v) => {
            const d = (v.viewed_at || '').slice(0, 10)
            if (d) byDay[d] = (byDay[d] || 0) + 1
          })
          const dayRows = Object.entries(byDay).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 30)
          const maxDay = Math.max(1, ...dayRows.map((r) => r[1]))
          return (
            <>
              <div className="metric-grid">
                <div className="metric-card"><div className="metric-num">{total}</div><div>Total page views</div></div>
                <div className="metric-card"><div className="metric-num">{unique}</div><div>Unique visitors (sessions)</div></div>
                <div className="metric-card"><div className="metric-num">{todayViews}</div><div>Views today</div></div>
              </div>
              <h3>Views by page</h3>
              {pageRows.length === 0 ? <p className="hint">No page views yet — they start counting once the updated site is live.</p> : pageRows.map(([page, count]) => (
                <div className="bar-row" key={page}>
                  <span>{page} — {count} views</span>
                  <div className="bar-track"><span className="bar-fill" style={{ width: `${Math.round((count / maxPage) * 100)}%` }} /></div>
                </div>
              ))}
              <h3>Views by day (last 30 days)</h3>
              {dayRows.length === 0 ? <p className="hint">No page views yet.</p> : dayRows.map(([day, count]) => (
                <div className="bar-row" key={day}>
                  <span>{day} — {count} views</span>
                  <div className="bar-track"><span className="bar-fill" style={{ width: `${Math.round((count / maxDay) * 100)}%` }} /></div>
                </div>
              ))}
            </>
          )
        })()}
      </section>

      {/* Services */}
      <section className="panel-section">
        <h2>Hire me — services</h2>
        {data.services.map((row, i) => (
          <div className="row" key={row.id}>
            <input type="text" value={row.label} onChange={(e) => updateList('services', row.id, { label: e.target.value })} />
            <SaveButton onSave={() => saveRow('services', row)}>Save</SaveButton>
            <button onClick={() => reorder('services', 'services', i, -1)}>↑</button>
            <button onClick={() => reorder('services', 'services', i, 1)}>↓</button>
            <button onClick={() => deleteRow('services', row.id, 'services')}>Delete</button>
          </div>
        ))}
        <button className="btn secondary" onClick={() => addRow('services', { label: '' })}>+ Add service</button>
        <h3>Hire text</h3>
        <TextField label="Hire me text" textarea value={data.hire.body} onChange={(v) => setData((d) => ({ ...d, hire: { ...d.hire, body: v } }))} />
        <SaveButton className="btn" onSave={() => saveSingle('hire_text', data.hire)}>Save hire text</SaveButton>
      </section>

      {/* Social links */}
      <section className="panel-section">
        <h2>Contact links</h2>
        {data.links.map((row, i) => (
          <div className="row" key={row.id}>
            <input type="text" value={row.label} onChange={(e) => updateList('links', row.id, { label: e.target.value })} placeholder="Label" />
            <input type="text" value={row.url} onChange={(e) => updateList('links', row.id, { url: e.target.value })} placeholder="URL" />
            <SaveButton onSave={() => saveRow('social_links', row)}>Save</SaveButton>
            <button onClick={() => reorder('social_links', 'links', i, -1)}>↑</button>
            <button onClick={() => reorder('social_links', 'links', i, 1)}>↓</button>
            <button onClick={() => deleteRow('social_links', row.id, 'links')}>Delete</button>
          </div>
        ))}
        <button className="btn secondary" onClick={() => addRow('links', { label: '', url: '' })}>+ Add link</button>
      </section>
    </div>
  )
}
