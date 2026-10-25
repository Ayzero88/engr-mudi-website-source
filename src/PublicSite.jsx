import React from 'react'

export default function PublicSite({ content, theme, onToggleTheme }) {
  const { hero, stack, projects, coaching, coachingTopics, coachingPhotos, books, services, socialLinks, hire } = content

  return (
    <div className={theme === 'light' ? 'page light' : 'page'}>
      <header className="header">
        <div className="header-inner">
          <a className="brand" href="#/">
            {hero.logo_url && <img className="logo" src={hero.logo_url} alt="AXAT logo" />}
            <span className="brand-name">{hero.brand_tag}</span>
          </a>
          <nav className="nav">
            <a href="#software">Software</a>
            <a href="#coaching">Coaching</a>
            <a href="#books">Books</a>
            <a href="#hire">Hire me</a>
            <button type="button" className="theme-toggle" onClick={onToggleTheme}>
              {theme === 'light' ? '🌙 Dark mode' : '☀️ Light mode'}
            </button>
          </nav>
        </div>
      </header>

      <main>
        <section className="hero">
          <h1>{hero.full_name}</h1>
          <p className="brand-tag">{hero.brand_tag}</p>
          <p>
            <a className="shorts-link" href={hero.shorts_url} target="_blank" rel="noreferrer">
              {hero.shorts_label} →
            </a>
          </p>
          <p className="hero-sub">Software developer and author.</p>
        </section>

        <section className="section">
          <h2>Stack</h2>
          <div className="stack">
            {stack.map((item) => (
              <span className="chip" key={item.id}>{item.label}</span>
            ))}
          </div>
        </section>

        <section className="section" id="software">
          <h2>Software &amp; Projects</h2>
          <div className="grid">
            {projects.map((p) => (
              <article className="card" key={p.id}>
                {p.image_url && <img className="project-img" src={p.image_url} alt={`${p.title} screenshot`} />}
                <h3>{p.title}</h3>
                {p.tagline && <p className="tagline">{p.tagline}</p>}
                <p>{p.description}</p>
                <p>
                  <span className={p.status === 'LIVE' ? 'badge live' : 'badge soon'}>{p.status}</span>
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="section" id="coaching">
          <h2>Coaching</h2>
          <p>{coaching.body}</p>
          <h3>What I coach</h3>
          <div className="stack">
            {coachingTopics.map((t) => (
              <span className="chip" key={t.id}>{t.label}</span>
            ))}
          </div>
          <p>You can also learn any software language on my stack.</p>
          {coaching.note && <p className="note-box">{coaching.note}</p>}
          <div className="grid">
            {coachingPhotos.map((ph) => (
              <figure className="photo" key={ph.id}>
                <img src={ph.image_url} alt={ph.caption || 'Coaching photo'} />
                {ph.caption && <figcaption>{ph.caption}</figcaption>}
              </figure>
            ))}
          </div>
        </section>

        <section className="section" id="books">
          <h2>Books</h2>
          <div className="grid">
            {books.map((b) => (
              <article className="card" key={b.id}>
                <h3>{b.title}</h3>
                <p>{b.description}</p>
                <p className="price">{b.price_label}</p>
                {b.coming_soon ? (
                  <p><span className="badge soon">COMING SOON</span></p>
                ) : (
                  <p className="buy-row">
                    {b.selar_url && (
                      <a className="btn" href={b.selar_url} target="_blank" rel="noreferrer">Buy on Selar</a>
                    )}
                    {b.paystack_url && (
                      <a className="btn secondary" href={b.paystack_url} target="_blank" rel="noreferrer">Buy on Paystack</a>
                    )}
                  </p>
                )}
              </article>
            ))}
          </div>
        </section>

        <section className="section" id="hire">
          <h2>Hire me</h2>
          <p>{hire.body}</p>
          <ul>
            {services.map((s) => (
              <li key={s.id}>{s.label}</li>
            ))}
          </ul>
          <h3 className="contact-title">Contact</h3>
          <p className="buy-row">
            {socialLinks.map((l) => (
              <a className="btn secondary" key={l.id} href={l.url} target="_blank" rel="noreferrer">{l.label}</a>
            ))}
          </p>
        </section>
      </main>

      <footer className="footer">
        <p>© {new Date().getFullYear()} Ayzeroxa Technologies. All rights reserved.</p>
      </footer>
    </div>
  )
}
