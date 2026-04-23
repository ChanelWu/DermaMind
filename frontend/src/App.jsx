import { useState, useRef, useEffect } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import Terms from './components/Terms.jsx'
import Disclaimer from './components/Disclaimer.jsx'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

async function postAnalyze(query) {
  const r = await fetch(`${BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })
  if (!r.ok) {
    const e = await r.json().catch(() => ({}))
    throw new Error(e.detail ?? `HTTP ${r.status}`)
  }
  return r.json()
}

async function fetchArticles() {
  const r = await fetch(`${BASE}/articles`)
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.json()
}

// ── constants ─────────────────────────────────────────────────────────────────

const TIER = {
  strong:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  moderate: 'bg-violet-50  text-violet-700  border-violet-200',
  emerging: 'bg-amber-50   text-amber-700   border-amber-200',
}
const SKIN_TYPES = ['Dry', 'Oily', 'Combination']
const MAX_CHATS = 5

// ── helpers ───────────────────────────────────────────────────────────────────

function formatTime(ts) {
  const diff = Date.now() - ts
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── ui components ─────────────────────────────────────────────────────────────

function TierBadge({ tier }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full border text-[10px] font-medium ${TIER[tier] ?? TIER.emerging}`}>
      {tier}
    </span>
  )
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-6 py-5">
      {[0, 160, 320].map((delay, i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-violet-300 animate-bounce"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  )
}

function RoutineContent({ summary, content }) {
  return (
    <>
      <div className="px-6 py-5 border-b border-gray-50">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Overview</p>
        <p className="text-sm text-[#4a5568] leading-relaxed">{summary}</p>
      </div>
      <div className="px-6 py-5 border-b border-gray-50 grid grid-cols-2 gap-6">
        {[['morning', '☀', 'amber'], ['evening', '☾', 'indigo']].map(([period, icon, color]) => (
          <div key={period}>
            <p className={`text-[10px] font-semibold text-${color}-500 uppercase tracking-widest mb-3`}>
              {icon} {period.charAt(0).toUpperCase() + period.slice(1)}
            </p>
            <ol className="space-y-3">
              {content[period]?.map((s, i) => (
                <li key={i} className="flex gap-3">
                  <span className={`shrink-0 w-5 h-5 rounded-full bg-${color}-50 text-${color}-600 text-[10px] font-semibold flex items-center justify-center`}>
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-[#2d3748]">{s.step}</p>
                    <p className="text-xs text-gray-400 mt-0.5 leading-snug">{s.why}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </>
  )
}

function IngredientContent({ summary, content }) {
  return (
    <>
      <div className="px-6 py-5 border-b border-gray-50">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Overview</p>
        <p className="text-sm text-[#4a5568] leading-relaxed">{summary}</p>
      </div>
      <div className="px-6 py-5 border-b border-gray-50 space-y-4">
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Mechanism</p>
          <p className="text-sm text-[#4a5568] leading-relaxed">{content.mechanism}</p>
        </div>
        <div className="flex items-start gap-6">
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Evidence</p>
            <TierBadge tier={content.evidence_tier} />
          </div>
          {content.concentration && (
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Effective Range</p>
              <p className="text-sm text-[#4a5568]">{content.concentration}</p>
            </div>
          )}
        </div>
        {content.best_for?.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Best For</p>
            <div className="flex flex-wrap gap-1.5">
              {content.best_for.map((b, i) => (
                <span key={i} className="px-2.5 py-1 bg-gray-50 rounded-full text-xs text-gray-500 border border-gray-100">{b}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function GeneralContent({ summary, content }) {
  return (
    <div className="px-6 py-5 border-b border-gray-50">
      <p className="text-sm text-[#4a5568] leading-relaxed">{summary}</p>
      {content?.answer && content.answer !== summary && (
        <p className="text-sm text-[#4a5568] leading-relaxed mt-3">{content.answer}</p>
      )}
    </div>
  )
}

function ConcernContent({ summary, content }) {
  return (
    <>
      <div className="px-6 py-5 border-b border-gray-50">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Overview</p>
        <p className="text-sm text-[#4a5568] leading-relaxed">{summary}</p>
      </div>
      <div className="px-6 py-5 border-b border-gray-50">
        {content.explanation && (
          <p className="text-sm text-[#4a5568] leading-relaxed mb-4">{content.explanation}</p>
        )}
        {content.ingredients?.length > 0 && (
          <>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Relevant Ingredients</p>
            <div className="space-y-2">
              {content.ingredients.slice(0, 3).map((ing, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#2d3748]">{ing.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5 leading-snug">{ing.function}</p>
                  </div>
                  <TierBadge tier={ing.evidence_tier} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}

function MessageCard({ msg }) {
  const { query, data, error, loading } = msg

  function renderContent() {
    if (!data) return null
    const props = { summary: data.summary, content: data.content ?? {} }
    switch (data.type) {
      case 'routine':    return <RoutineContent    {...props} />
      case 'ingredient': return <IngredientContent {...props} />
      case 'concern':    return <ConcernContent    {...props} />
      default:           return <GeneralContent    {...props} />
    }
  }

  return (
    <div className="w-full space-y-3">
      <div className="flex justify-end">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl px-4 py-2.5 text-sm text-[#2d3748] shadow-sm max-w-[80%] border border-white/60">
          {query}
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-md border border-white/70 overflow-hidden">
        {loading && <TypingIndicator />}
        {error   && <div className="p-6 text-sm text-red-400">{error}</div>}
        {data && (
          <>
            {renderContent()}
            <div className="px-6 py-4">
              <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                <p className="text-[11px] text-amber-700/80 leading-relaxed">
                  ⚠️ Educational purposes only. DermaMind provides general skincare science information and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified dermatologist or healthcare provider before making changes to your skincare routine, especially if you have a skin condition, allergy, or are taking medication. Individual results may vary.
                </p>
              </div>
            </div>
</>
        )}
      </div>
    </div>
  )
}

function NewsSidebar({ articles, loading, onClose }) {
  return (
    <div className="fixed inset-y-0 right-0 w-[380px] bg-white/95 backdrop-blur-md shadow-2xl flex flex-col z-50 slide-in-right">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-[#2d3748]">Latest News</h2>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors text-lg leading-none"
        >
          ×
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center gap-1.5 pt-12">
            {[0, 160, 320].map((delay, i) => (
              <span
                key={i}
                className="w-2 h-2 rounded-full bg-violet-300 animate-bounce"
                style={{ animationDelay: `${delay}ms` }}
              />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <p className="text-sm text-gray-400 pt-4">No articles found.</p>
        ) : (
          articles.map((a, i) => (
            <div key={i} className="rounded-xl border border-gray-100 p-4 hover:border-gray-200 hover:shadow-sm transition-all">
              <h3 className="text-sm font-medium text-[#2d3748] leading-snug mb-1">{a.title}</h3>
              {(a.source || a.date) && (
                <p className="text-[10px] text-gray-300 mb-1.5">
                  {[a.source, a.date].filter(Boolean).join(' · ')}
                </p>
              )}
              {a.summary && (
                <p className="text-xs text-gray-400 leading-snug line-clamp-2 mb-2">{a.summary}</p>
              )}
              {a.url && (
                <a href={a.url} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-violet-500 hover:text-violet-600 font-medium transition-colors">
                  Read More →
                </a>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ── app ───────────────────────────────────────────────────────────────────────

function MainPage() {
  const [chats, setChats] = useState([])
  const [activeChatId, setActiveChatId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [skinType, setSkinType] = useState(null)
  const [loading, setLoading] = useState(false)

  const [newsOpen, setNewsOpen] = useState(false)
  const [newsArticles, setNewsArticles] = useState([])
  const [newsLoaded, setNewsLoaded] = useState(false)
  const [newsLoading, setNewsLoading] = useState(false)

  const [showScrollTop, setShowScrollTop] = useState(false)
  const bottomRef = useRef(null)
  const scrollRef = useRef(null)
  const sessionId = useRef(null)

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Scroll-to-top button visibility
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onScroll = () => setShowScrollTop(el.scrollTop > 300)
    el.addEventListener('scroll', onScroll)
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  // Auto-save current conversation to localStorage
  useEffect(() => {
    if (messages.length === 0) return
    if (!sessionId.current) sessionId.current = Date.now().toString()
    const id = sessionId.current
    const chat = {
      id,
      title: messages[0].query.slice(0, 30),
      timestamp: Date.now(),
      messages,
      skinType,
    }
    setChats(prev => {
      const idx = prev.findIndex(c => c.id === id)
      return idx >= 0
        ? prev.map(c => c.id === id ? chat : c)
        : [chat, ...prev].slice(0, MAX_CHATS)
    })
  }, [messages, skinType])

  async function toggleNews() {
    if (newsOpen) { setNewsOpen(false); return }
    setNewsOpen(true)
    if (!newsLoaded) {
      setNewsLoading(true)
      try {
        const d = await fetchArticles()
        setNewsArticles(d.articles ?? [])
        setNewsLoaded(true)
      } catch { setNewsArticles([]) }
      finally { setNewsLoading(false) }
    }
  }

  async function submit() {
    const q = input.trim()
    if (!q || loading) return
    const fullQuery = skinType ? `[Skin type: ${skinType}] ${q}` : q
    setInput('')
    setLoading(true)
    const id = Date.now()
    setMessages(prev => [...prev, { id, query: q, data: null, error: null, loading: true }])

    try {
      const result = await postAnalyze(fullQuery)
      setMessages(prev => prev.map(m => m.id === id ? { ...m, data: result.analysis, loading: false } : m))
    } catch (e) {
      setMessages(prev => prev.map(m => m.id === id ? { ...m, error: e.message, loading: false } : m))
    } finally {
      setLoading(false)
    }
  }

  function startNewChat() {
    sessionId.current = null
    setActiveChatId(null)
    setMessages([])
    setSkinType(null)
    setInput('')
  }

  function loadChat(chat) {
    sessionId.current = chat.id
    setActiveChatId(chat.id)
    setMessages(chat.messages)
    setSkinType(chat.skinType ?? null)
    setInput('')
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'linear-gradient(180deg, #9fb9c8 0%, #b5cad6 18%, #ccdae0 35%, #e5e9ec 50%, #f0e4d8 68%, #f4d6c0 84%, #f2caa8 100%)' }}>

      {/* Nav */}
      <nav className="shrink-0 flex items-center justify-between px-6 py-4">
        <span className="text-xl font-semibold text-[#2d3748] tracking-tight">DermaMind</span>
        <button
          onClick={toggleNews}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
            newsOpen
              ? 'bg-white/80 text-[#2d3748] shadow-sm'
              : 'text-[#4a5568] hover:text-[#2d3748] hover:bg-white/40'
          }`}
        >
          Latest News
        </button>
      </nav>

      {/* Body */}
      <div className="flex flex-1 min-h-0">

        {/* Left sidebar — always visible */}
        <aside className="w-52 shrink-0 border-r border-white/40 overflow-y-auto bg-white/10">
          <div className="px-2.5 pt-6 pb-2.5">
            <button
              onClick={startNewChat}
              className="w-full flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium text-[#4a5568] border border-[#2d3748]/20 hover:bg-white/50 hover:border-[#2d3748]/30 transition-all mb-3"
            >
              <span className="text-sm leading-none">+</span> New Chat
            </button>
            <div className="space-y-1">
              {chats.map(chat => (
                <button
                  key={chat.id}
                  onClick={() => loadChat(chat)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl transition-all ${
                    activeChatId === chat.id
                      ? 'bg-violet-100/80 text-[#2d3748]'
                      : 'text-[#4a5568] hover:bg-white/50'
                  }`}
                >
                  <p className="text-xs font-medium truncate">{chat.title}</p>
                  <p className="text-[10px] text-[#4a5568]/50 mt-0.5">{formatTime(chat.timestamp)}</p>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 flex flex-col min-h-0">

          {/* Scrollable messages area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center px-4" style={{ minHeight: 'calc(100vh - 260px)' }}>
                <h1 className="text-4xl font-bold text-[#2d3748] mb-3 leading-tight">
                  Your Skin, Backed by Science
                </h1>
                <p className="text-lg text-[#718096] max-w-md leading-relaxed">
                  Ask DermaMind about ingredients, routines, and the research behind them
                </p>
              </div>
            ) : (
              <div className="py-6 px-4 max-w-2xl mx-auto w-full space-y-6">
                {messages.map(msg => <MessageCard key={msg.id} msg={msg} />)}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="shrink-0 px-4 pb-8 pt-2">
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-2xl shadow-lg border border-white/80">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }}
                  placeholder="What would you like to know about your skin today?"
                  rows={2}
                  className="w-full px-6 pt-5 pb-2 text-[15px] text-[#2d3748] placeholder-gray-300 resize-none focus:outline-none bg-transparent leading-relaxed"
                />
                <div className="flex items-center justify-end px-5 pb-4">
                  <button
                    onClick={submit}
                    disabled={loading || !input.trim()}
                    className="w-9 h-9 rounded-full bg-[#7c8ee0] hover:bg-[#6b7dd4] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors shadow-sm"
                  >
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                      <path d="M7.5 12V3M7.5 3L3.5 7M7.5 3l4 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Skin type pills */}
              <div className="flex items-center justify-center gap-2 mt-4">
                {SKIN_TYPES.map(type => {
                  const active = skinType === type.toLowerCase()
                  return (
                    <button
                      key={type}
                      onClick={() => setSkinType(t => t === type.toLowerCase() ? null : type.toLowerCase())}
                      className={`px-4 py-1.5 rounded-full text-sm border transition-all ${
                        active
                          ? 'bg-violet-400 border-violet-400 text-white shadow-sm'
                          : 'bg-white/40 border-[#2d3748]/20 text-[#4a5568] hover:bg-white/60 hover:border-[#2d3748]/30'
                      }`}
                    >
                      {type}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="shrink-0 py-3 text-center">
        <p className="text-[11px] text-[#4a5568]/40 leading-relaxed">
          © 2026 DermaMind by Xueying Wu. All rights reserved.{' '}
          <Link to="/terms" className="underline hover:text-[#4a5568]/70 transition-colors">
            Terms of Use
          </Link>
          {' · '}
          <Link to="/disclaimer" className="underline hover:text-[#4a5568]/70 transition-colors">
            Disclaimer
          </Link>
          .
        </p>
      </footer>

      {/* Scroll to top */}
      {showScrollTop && (
        <button
          onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-8 right-8 w-11 h-11 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center text-violet-400 hover:text-violet-600 hover:shadow-xl transition-all z-30"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 12V4M8 4L4 8M8 4l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      {/* Latest News sidebar */}
      {newsOpen && (
        <>
          <div className="fixed inset-0 bg-black/10 z-40" onClick={() => setNewsOpen(false)} />
          <NewsSidebar articles={newsArticles} loading={newsLoading} onClose={() => setNewsOpen(false)} />
        </>
      )}
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MainPage />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/disclaimer" element={<Disclaimer />} />
    </Routes>
  )
}
