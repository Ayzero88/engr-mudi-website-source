import React, { useRef, useState } from 'react'
import { findAnswer, knowledgeText, NO_RESULT } from './ayzeroxaKnowledge'

// Ayzeroxa bot — "Ask me anything about Ayzeroxa".
// Free model: Pollinations text API (no key, no signup). It is only used
// to rephrase an answer the site already knows. The guardrail runs BEFORE
// any model call: if no knowledge entry matches the question, the bot
// answers "I have no result for this request." and never calls the model.
// If the model fails, or its reply adds a link this site does not list,
// the bot falls back to the site's own answer.
async function askFreeModel(question, matched, content) {
  const prompt = [
    'You are the Ayzeroxa bot on the Ayzeroxa Technologies website.',
    'Answer ONLY from the knowledge below. Do not invent prices, links, services, dates or facts.',
    'Keep the answer short, plain and direct, in the same style as the knowledge.',
    'If the question is not answered by the knowledge, reply exactly: I have no result for this request.',
    '',
    'KNOWLEDGE:',
    knowledgeText(content),
    '',
    `MATCHED TOPIC: ${matched.id}`,
    `SITE ANSWER: ${matched.answer}`,
    '',
    `QUESTION: ${question}`,
    'ANSWER:',
  ].join('\n')
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 15000)
  try {
    const res = await fetch(`https://text.pollinations.ai/${encodeURIComponent(prompt)}`, { signal: controller.signal })
    if (!res.ok) return null
    const text = (await res.text()).trim()
    if (!text || text.length > 1200) return null
    // Guard: the model must not introduce links the site does not list.
    const urls = text.match(/https?:\/\/[^\s)"]+/g) || []
    const allowed = new Set([...matched.links.map((l) => l.href), 'https://www.youtube.com/@EngrMudi', 'https://www.youtube.com/@EngrMudi/shorts'])
    if (urls.some((u) => !allowed.has(u.replace(/[.,]$/, '')))) return null
    if (/i have no result/i.test(text)) return null
    return text
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

const SUGGESTIONS = [
  'What books do you sell?',
  'What software have you built?',
  'What coaching do you offer?',
  'How do I hire you?',
]

export default function AyzeroxaChat({ content }) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: 'Hi, I am the Ayzeroxa bot. Ask me anything about Ayzeroxa — our books, software, coaching, or how to hire us. If I do not know it, I will say so.',
      links: [],
      nav: null,
    },
  ])
  const listRef = useRef(null)

  function scrollDown() {
    setTimeout(() => {
      if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
    }, 50)
  }

  async function send(text) {
    const question = (text || '').trim()
    if (!question || busy) return
    setMessages((m) => [...m, { role: 'user', text: question, links: [], nav: null }])
    setInput('')
    setBusy(true)
    scrollDown()
    const matched = findAnswer(question, content)
    if (!matched) {
      setMessages((m) => [...m, { role: 'bot', text: NO_RESULT, links: [], nav: null }])
      setBusy(false)
      scrollDown()
      return
    }
    const phrased = await askFreeModel(question, matched, content)
    setMessages((m) => [
      ...m,
      { role: 'bot', text: phrased || matched.answer, links: matched.links, nav: matched.nav },
    ])
    setBusy(false)
    scrollDown()
  }

  return (
    <>
      {!open && (
        <button type="button" className="chat-float" onClick={() => setOpen(true)} aria-label="Ask Ayzeroxa">
          Ask Ayzeroxa
        </button>
      )}
      {open && (
        <div className="chat-panel" role="dialog" aria-label="Ask me anything about Ayzeroxa">
          <div className="chat-head">
            <div>
              <strong>Ask me anything about Ayzeroxa</strong>
              <div className="chat-sub">I only answer from what Ayzeroxa offers. If I don&apos;t know it, I&apos;ll say so.</div>
            </div>
            <button type="button" className="chat-close" onClick={() => setOpen(false)} aria-label="Close chat">✕</button>
          </div>
          <div className="chat-messages" ref={listRef}>
            {messages.map((msg, i) => (
              <div key={i} className={msg.role === 'user' ? 'chat-msg user' : 'chat-msg bot'}>
                <p>{msg.text}</p>
                {msg.links && msg.links.length > 0 && (
                  <p className="chat-links">
                    {msg.links.map((l) => (
                      <a key={l.href + l.label} href={l.href} target="_blank" rel="noreferrer">{l.label} →</a>
                    ))}
                  </p>
                )}
                {msg.nav && (
                  <p>
                    <a className="btn secondary chat-nav" href={msg.nav.href} onClick={() => setOpen(false)}>{msg.nav.label} →</a>
                  </p>
                )}
              </div>
            ))}
            {busy && <div className="chat-msg bot"><p>Thinking…</p></div>}
          </div>
          <div className="chat-suggestions">
            {SUGGESTIONS.map((s) => (
              <button key={s} type="button" onClick={() => send(s)} disabled={busy}>{s}</button>
            ))}
          </div>
          <form
            className="chat-form"
            onSubmit={(e) => {
              e.preventDefault()
              send(input)
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about books, software, coaching…"
              aria-label="Ask the Ayzeroxa bot"
            />
            <button className="btn" type="submit" disabled={busy || !input.trim()}>Send</button>
          </form>
        </div>
      )}
    </>
  )
}
