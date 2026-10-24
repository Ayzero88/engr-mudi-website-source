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

function TextField({ label, value, onChange, textarea }) {
  return (
    <label className="field">
      <span>{label}</span>
      {textarea ? (
        <textarea value={value || ''} onChange={(e) => onChange(e.target.value)} rows={3} />
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
    if (session) loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  async function loadAll() {
    // Single-row tables (hero, coaching, hire_text) have no position column,
    // so they must not be ordered by it — only the list tables get an order.
    const singleTables = ['hero', 'coaching', 'hire_text']
    const listTables = ['stack_items', 'projects', 'coaching_photos', 'books', 'services', 'social_links']
    const results = await Promise.all([
      ...singleTables.map((t) => supabase.from(t).select('*')),
      ...listTables.map((t) => supabase.from(t).select('*').order('position', { ascending: true })),
    ])
    const failed = results.find((r) => r.error)
    if (failed) {
      setLoadError(failed.error.message)
      return
    }
    const [hero, coaching, hire, stack, projects, photos, books, services, links] = results.map((r) => r.data)
    setData({
      hero: hero[0] || {},
      stack,
      projects,
      coaching: coaching[0] || {},
      photos,
      books,
      services,
      links,
      hire: hire[0] || {},
    })
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
        <TextField label="Brand tag" value={data.hero.brand_tag} onChange={(v) => setData((d) => ({ ...d, hero: { ...d.hero, brand_tag: v } }))} />
        <TextField label="Shorts link label" value={data.hero.shorts_label} onChange={(v) => setData((d) => ({ ...d, hero: { ...d.hero, shorts_label: v } }))} />
        <TextField label="Shorts link URL" value={data.hero.shorts_url} onChange={(v) => setData((d) => ({ ...d, hero: { ...d.hero, shorts_url: v } }))} />
        <ImageField label="Logo" value={data.hero.logo_url} onChange={(v) => setData((d) => ({ ...d, hero: { ...d.hero, logo_url: v } }))} />
        <button className="btn" onClick={() => saveSingle('hero', data.hero).catch((e) => alert(e.message))}>Save hero</button>
      </section>

      {/* Stack */}
      <section className="panel-section">
        <h2>Stack</h2>
        {data.stack.map((row, i) => (
          <div className="row" key={row.id}>
            <input type="text" value={row.label} onChange={(e) => updateList('stack', row.id, { label: e.target.value })} />
            <button onClick={() => saveRow('stack_items', row).catch((e) => alert(e.message))}>Save</button>
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
              <button onClick={() => saveRow('projects', row).catch((e) => alert(e.message))}>Save</button>
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
        <button className="btn" onClick={() => saveSingle('coaching', data.coaching).catch((e) => alert(e.message))}>Save coaching text</button>
        <h3>Photos</h3>
        {data.photos.map((row, i) => (
          <div className="card-edit" key={row.id}>
            <ImageField label="Photo" value={row.image_url} onChange={(v) => updateList('photos', row.id, { image_url: v })} />
            <TextField label="Caption" value={row.caption} onChange={(v) => updateList('photos', row.id, { caption: v })} />
            <div className="row">
              <button onClick={() => saveRow('coaching_photos', row).catch((e) => alert(e.message))}>Save</button>
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
              <button onClick={() => saveRow('books', row).catch((e) => alert(e.message))}>Save</button>
              <button onClick={() => reorder('books', 'books', i, -1)}>↑</button>
              <button onClick={() => reorder('books', 'books', i, 1)}>↓</button>
              <button onClick={() => deleteRow('books', row.id, 'books')}>Delete</button>
            </div>
          </div>
        ))}
        <button className="btn secondary" onClick={() => addRow('books', { title: '', description: '', price_label: '', selar_url: '', paystack_url: '', coming_soon: false })}>+ Add book</button>
      </section>

      {/* Services */}
      <section className="panel-section">
        <h2>Hire me — services</h2>
        {data.services.map((row, i) => (
          <div className="row" key={row.id}>
            <input type="text" value={row.label} onChange={(e) => updateList('services', row.id, { label: e.target.value })} />
            <button onClick={() => saveRow('services', row).catch((e) => alert(e.message))}>Save</button>
            <button onClick={() => reorder('services', 'services', i, -1)}>↑</button>
            <button onClick={() => reorder('services', 'services', i, 1)}>↓</button>
            <button onClick={() => deleteRow('services', row.id, 'services')}>Delete</button>
          </div>
        ))}
        <button className="btn secondary" onClick={() => addRow('services', { label: '' })}>+ Add service</button>
        <h3>Hire text</h3>
        <TextField label="Hire me text" textarea value={data.hire.body} onChange={(v) => setData((d) => ({ ...d, hire: { ...d.hire, body: v } }))} />
        <button className="btn" onClick={() => saveSingle('hire_text', data.hire).catch((e) => alert(e.message))}>Save hire text</button>
      </section>

      {/* Social links */}
      <section className="panel-section">
        <h2>Contact links</h2>
        {data.links.map((row, i) => (
          <div className="row" key={row.id}>
            <input type="text" value={row.label} onChange={(e) => updateList('links', row.id, { label: e.target.value })} placeholder="Label" />
            <input type="text" value={row.url} onChange={(e) => updateList('links', row.id, { url: e.target.value })} placeholder="URL" />
            <button onClick={() => saveRow('social_links', row).catch((e) => alert(e.message))}>Save</button>
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
