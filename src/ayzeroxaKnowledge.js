// Ayzeroxa bot knowledge — built ONLY from this website's own content.
// Guardrail: the chat may only answer from the entries below. Anything
// else gets exactly: "I have no result for this request."
// No prices, links, dates or services are invented here. Store links are
// the real ones: Selar store page, Paystack shop, Vendlinx store.

export const NO_RESULT = 'I have no result for this request.'

export const STORE_LINKS = [
  { label: 'Selar store', href: 'https://selar.com/m/osemudiamen-ayo-okhiria1' },
  { label: 'Paystack shop', href: 'https://paystack.shop/engr-mudi' },
  { label: 'Vendlinx store', href: 'https://vendlinx.com/s/engr-mudi' },
]

const VENDLINX_PRODUCTS = {
  python: 'https://vendlinx.com/p/python-in-60-seconds-the-cheat-sheet-pack',
  javascript: 'https://vendlinx.com/p/javascript-in-60-seconds-the-cheat-sheet-pack',
  react: 'https://vendlinx.com/p/react-in-60-seconds-the-cheat-sheet-pack',
  git: 'https://vendlinx.com/p/git-and-github-in-60-seconds-the-cheat-sheet-pack',
  flutter: 'https://vendlinx.com/p/flutter-and-dart-in-60-seconds-the-cheat-sheet-pack',
}

const SELAR_PRODUCTS = {
  python: 'https://selar.com/5q95v67lfg',
  javascript: 'https://selar.com/4o82179271',
  react: 'https://selar.com/1ug1c99172',
  git: 'https://selar.com/c6nb76gsj1',
  flutter: 'https://selar.com/66632ae7l3',
}

function norm(s) {
  return (s || '').toLowerCase()
}

function bookKey(title) {
  const t = norm(title)
  if (t.includes('python')) return 'python'
  if (t.includes('javascript')) return 'javascript'
  if (t.includes('react')) return 'react'
  if (t.includes('git')) return 'git'
  if (t.includes('flutter')) return 'flutter'
  return null
}

function bookLabel(key) {
  return { python: 'Python', javascript: 'JavaScript', react: 'React', git: 'Git & GitHub', flutter: 'Flutter & Dart' }[key] || key
}

// Build the answer entries from live site content (or seed fallback).
// Each entry: keywords that must match, a plain answer, links, and a
// section the visitor can jump to.
export function buildKnowledge(content) {
  const c = content || {}
  const about = (c.about && c.about.body) || 'Ayzeroxa Technologies builds software and tutors people from no tech background to fullstack developers. We started in 2023, and our founder is Osemudiamen Ayo-Okhiria.'
  const books = Array.isArray(c.books) ? c.books : []
  const projects = Array.isArray(c.projects) ? c.projects : []
  const topics = Array.isArray(c.coachingTopics) ? c.coachingTopics.map((t) => t.label) : []
  const services = Array.isArray(c.services) ? c.services.map((s) => s.label) : []
  const links = Array.isArray(c.socialLinks) ? c.socialLinks : []
  const hireBody = (c.hire && c.hire.body) || 'I build software the way you want it. It does not have to be a web app. Tell me what you need it to do, and I will build it to your preference.'
  const coachingBody = (c.coaching && c.coaching.body) || 'I coach people online or in person through my company, Ayzeroxa Technologies.'
  const coachingNote = c.coaching && c.coaching.note ? ` ${c.coaching.note}` : ''

  const liveBooks = books.filter((b) => !b.coming_soon)
  const bundle = books.find((b) => b.coming_soon)
  const bookList = liveBooks.map((b) => `${b.title} — ${b.price_label || '₦2,500'}`).join(', ')
  const projectList = projects.map((p) => `${p.title} (${p.status})`).join(', ')

  const entries = []

  entries.push({
    id: 'about',
    keywords: ['ayzeroxa', 'about', 'who are you', 'company', 'founder', 'started', 'when did', 'history', 'what is ayzeroxa', 'who is engr mudi', 'who owns'],
    answer: `${about} The brand is Engr. Mudi, and the hero line here is "Learn, Build & Impact" — personalizing the code.`,
    links: [],
    nav: { label: 'Read the About section', href: '#about' },
  })

  entries.push({
    id: 'books',
    keywords: ['book', 'books', 'ebook', 'cheat sheet', 'cheat-sheet', 'pack', 'buy a book', 'buy book', 'price of book', 'how much is', 'sell', 'store', 'shop'],
    answer: `We sell these books: ${bookList || 'Python, JavaScript, React, Git & GitHub, and Flutter & Dart — ₦2,500 each'}. Each pack covers 15 topics, one page each — 60-second reads.${bundle ? ` ${bundle.title} is coming soon at ${bundle.price_label || '₦7,500'}.` : ''} You can buy from any of the three stores below.`,
    links: [...STORE_LINKS],
    nav: { label: 'See the Books section', href: '#books' },
  })

  // One entry per book, so "Python book" gives that book's own links.
  for (const b of liveBooks) {
    const key = bookKey(b.title)
    if (!key) continue
    const extra = []
    if (SELAR_PRODUCTS[key]) extra.push({ label: `Buy ${bookLabel(key)} on Selar`, href: SELAR_PRODUCTS[key] })
    if (VENDLINX_PRODUCTS[key]) extra.push({ label: `Buy ${bookLabel(key)} on Vendlinx`, href: VENDLINX_PRODUCTS[key] })
    entries.push({
      id: `book-${key}`,
      keywords: [`${key} book`, `${key} pack`, `buy ${key}`, bookLabel(key).toLowerCase()],
      answer: `${bookLabel(key)} — ${b.description || '15 topics, one page each. 60-second reads.'} Price: ${b.price_label || '₦2,500'}. Buy it from the stores below.`,
      links: [...extra, { label: 'Paystack shop (all books)', href: 'https://paystack.shop/engr-mudi' }],
      nav: { label: 'See the Books section', href: '#books' },
    })
  }

  entries.push({
    id: 'software',
    keywords: ['software', 'app', 'apps', 'project', 'projects', 'avery', 'flock', 'weighing', 'weighbridge', 'built', 'portfolio'],
    answer: `Software we have built: ${projectList || 'Avery Data Professional (LIVE), Flock Tracker (LIVE), Weighing Software (Coming Soon)'}. Avery Data Professional is an admin suite for digital authorization and generating, working on, and saving calibration certificates, quotes, invoices, reports, and payment vouchers. Flock Tracker is a church attendance app that takes attendance and tracks each member over time. The weighing software retrieves weight from weighbridge equipment and scales and stores it, and it is coming before December 2026.`,
    links: [],
    nav: { label: 'See Software & Projects', href: '#software' },
  })

  entries.push({
    id: 'coaching',
    keywords: ['coach', 'coaching', 'tutor', 'tutoring', 'training', 'learn', 'course', 'class', 'student', 'batch', 'frontend', 'front end', 'backend', 'back end', 'fullstack', 'full stack', 'flutter', 'machine learning', 'mathematics', 'maths', 'ai agent'],
    answer: `${coachingBody}${coachingNote} Subjects: ${topics.join(', ') || 'Front End Development, Backend Development, Fullstack Development, How to Use AI Agents, Flutter Development for Mobile, Machine Learning, Mathematics'}. You can also learn any software language on the stack.`,
    links: [],
    nav: { label: 'See Coaching', href: '#coaching' },
  })

  entries.push({
    id: 'hire',
    keywords: ['hire', 'hire us', 'hire you', 'service', 'services', 'build for me', 'build me', 'custom', 'work with you', 'need a website', 'need an app', 'need software'],
    answer: `${hireBody}${services.length ? ` Services listed: ${services.join(' ')}` : ' We also coach people on how to use AI to build things.'} There is no fixed price for custom software here — tell us what you need it to do and we build it to your preference. Reach us from the Hire section.`,
    links: links.filter((l) => /whatsapp/i.test(l.label)).map((l) => ({ label: 'WhatsApp us', href: l.url })),
    nav: { label: 'Go to Hire us', href: '#hire' },
  })

  entries.push({
    id: 'contact',
    keywords: ['contact', 'whatsapp', 'phone', 'number', 'email', 'follow', 'instagram', 'facebook', 'youtube', 'shorts', 'comedy', 'social'],
    answer: `You can reach Ayzeroxa on WhatsApp, YouTube, Instagram and Facebook — the links are below and in the Hire section. The dev comedy Shorts are on YouTube at Engr Mudi.`,
    links: [
      { label: 'WhatsApp', href: 'https://wa.me/2348075421099' },
      { label: 'YouTube — @EngrMudi', href: 'https://www.youtube.com/@EngrMudi' },
      { label: 'YouTube Shorts', href: 'https://www.youtube.com/@EngrMudi/shorts' },
      { label: 'Instagram — engr.mudi', href: 'https://www.instagram.com/engr.mudi' },
      { label: 'Facebook', href: 'https://www.facebook.com/AyoOsemudiamen' },
    ],
    nav: { label: 'Go to Hire us / Contact', href: '#hire' },
  })

  entries.push({
    id: 'stack',
    keywords: ['stack', 'language', 'languages', 'technology', 'technologies', 'tools', 'what do you use', 'tech stack'],
    answer: `The stack listed on this site: Java, Dart, HTML, Flutter, Python, Motoko, React, Node.js, Next.js, Firebase, MongoDB, Supabase, Postgres, SQLite3, and Machine Learning.`,
    links: [],
    nav: { label: 'See the Stack', href: '#about' },
  })

  entries.push({
    id: 'blog',
    keywords: ['blog', 'article', 'articles', 'post', 'posts', 'topic', 'waec'],
    answer: `The blog has separate subject threads with shareable links. The first planned thread is "Prepare for WAEC Mathematics in 30 Days". Open the blog from the navigation to see the topics that are live.`,
    links: [],
    nav: { label: 'Open the Blog', href: '#/blog' },
  })

  return { about, entries, bookList, projectList }
}

// Tutorial / general-knowledge questions are OUT of scope, even when they
// mention a known word ("What is Python?", "Teach me React") — the bot
// knows what Ayzeroxa sells and offers, not the subject itself.
const OUT_OF_SCOPE_HINTS = [
  'what is ', 'what are ', 'explain', 'teach me', 'tutorial', 'how to code',
  'how do i code', 'write code', 'give me code', 'example code', 'solve ',
  'homework', 'assignment', 'weather', 'news', 'football', 'betting',
  'crypto', 'price of bitcoin', 'who is the president', 'joke', 'story',
]

export function findAnswer(question, content) {
  const q = norm(question).trim()
  if (!q) return null
  if (OUT_OF_SCOPE_HINTS.some((h) => q.includes(h))) {
    // Exception: "how do i buy / hire / contact" are in-scope actions.
    if (!/how do i (buy|hire|contact|reach|order)/.test(q)) return null
  }
  const { entries } = buildKnowledge(content)
  let best = null
  let bestScore = 0
  for (const e of entries) {
    let score = 0
    for (const kw of e.keywords) {
      if (kw && q.includes(kw)) score += kw.length > 4 ? 2 : 1
    }
    // Single-word book names only count with a buying/book context.
    if (e.id.startsWith('book-') && !/book|pack|buy|price|sell|store/.test(q)) score = 0
    if (score > bestScore) {
      bestScore = score
      best = e
    }
  }
  if (!best || bestScore === 0) return null
  return best
}

export function knowledgeText(content) {
  const { about, entries } = buildKnowledge(content)
  const lines = [`About: ${about}`, ...entries.map((e) => `${e.id}: ${e.answer}`)]
  return lines.join('\n')
}
