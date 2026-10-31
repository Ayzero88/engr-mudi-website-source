import React, { useState, useEffect } from 'react'
import AyzeroxaChat from './AyzeroxaChat'

export default function PublicSite({ content, theme, onToggleTheme }) {
  const { hero, stack, projects, coaching, coachingTopics, coachingPhotos, books, services, socialLinks, hire } = content
  const [showTop, setShowTop] = useState(false)
  // Home link: on the home page itself a plain "#/" click does nothing
  // visible, so scroll back to the top instead.
  function goHome(e) {
    if (window.location.hash === '#/' || window.location.hash === '') {
      e.preventDefault()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className={theme === 'light' ? 'page light' : 'page'}>
      <header className="header">
        <div className="header-inner">
          <a className="brand" href="#/" onClick={goHome} aria-label="Home" title="Home">
            {hero.logo_url && <img className="logo" src={hero.logo_url} alt="AXAT logo" />}
            <span className="brand-name">Ayzeroxa Technologies</span>
          </a>
          <nav className="nav">
            <a href="#/" onClick={goHome}>Home</a>
            <a href="#about">About</a>
            <a href="#software">Software</a>
            <a href="#coaching">Coaching</a>
            <a href="#books">Books</a>
            <a href="#/blog">Blog</a>
            <a href="#hire">Hire us</a>
            <button type="button" className="theme-toggle" onClick={onToggleTheme}>
              {theme === 'light' ? '🌙 Dark mode' : '☀️ Light mode'}
            </button>
          </nav>
        </div>
      </header>

      <main>
        <section className="hero">
          <h1>Learn, Build &amp; Impact</h1>
          <p className="hero-tagline">Personalizing the code</p>
          <p className="brand-tag">{hero.brand_tag}</p>
          <p>
            <a className="shorts-link" href={hero.shorts_url} target="_blank" rel="noreferrer">
              {hero.shorts_label} →
            </a>
          </p>
          <p className="hero-sub">Software developer and author.</p>
        </section>

        <section className="section" id="about">
          <h2>About</h2>
          <p>{content.about && content.about.body ? content.about.body : 'Ayzeroxa Technologies builds software and tutors people from no tech background to fullstack developers. We started in 2023, and our founder is Osemudiamen Ayo-Okhiria.'}</p>
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
          <h2>Hire us</h2>
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
          <div className="contact-cards">
            <a className="contact-card" href="mailto:engr.mudi@ayzeroxa.com.ng">
              <span className="contact-icon direct" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>
              </span>
              <span className="contact-text"><span className="contact-label">Direct</span><span className="contact-email">engr.mudi@ayzeroxa.com.ng</span></span>
            </a>
            <a className="contact-card" href="mailto:info@ayzeroxa.com.ng">
              <span className="contact-icon general" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
              </span>
              <span className="contact-text"><span className="contact-label">General enquiries</span><span className="contact-email">info@ayzeroxa.com.ng</span></span>
            </a>
            <a className="contact-card" href="mailto:support@ayzeroxa.com.ng">
              <span className="contact-icon support" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"/></svg>
              </span>
              <span className="contact-text"><span className="contact-label">Support</span><span className="contact-email">support@ayzeroxa.com.ng</span></span>
            </a>
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>© {new Date().getFullYear()} Ayzeroxa Technologies. All rights reserved.</p>
      </footer>

      <a className="whatsapp-float" href="https://wa.me/2348075421099" target="_blank" rel="noreferrer" aria-label="WhatsApp" title="WhatsApp"><svg viewBox="0 0 24 24" width="30" height="30" fill="#fff" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2zm5.2 13.9c-.2.6-1.2 1.2-1.7 1.2-.4.1-1 .2-1.6-.1-.4-.2-.9-.4-1.5-.8-2.7-1.1-4.4-3.9-4.6-4.1-.1-.2-1-1.4-1-2.6s.6-1.8.9-2c.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.5s.8 1.9.8 2c.1.1.1.3 0 .5l-.4.6c-.1.2-.3.4-.1.7.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.7-.1l.6-.7c.2-.2.4-.2.6-.1l1.9.9c.2.1.4.2.4.3.1.2.1.7-.1 1.3z"/></svg></a>
      {showTop && (
        <button type="button" className="to-top-float" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Back to top">↑</button>
      )}
      <AyzeroxaChat content={content} />
    </div>
  )
}
