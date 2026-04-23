import { useState, useRef, useEffect } from 'react'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

const TIER_STYLE = {
  strong:   'text-emerald-400 border-emerald-400/30 bg-emerald-400/5',
  moderate: 'text-indigo-400  border-indigo-400/30  bg-indigo-400/5',
  emerging: 'text-amber-400   border-amber-400/30   bg-amber-400/5',
}

function Skeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      {[0.75, 1, 0.6, 0.9, 0.5].map((w, i) => (
        <div key={i} className="h-2.5 bg-[#181826] rounded" style={{ width: `${w * 100}%` }} />
      ))}
    </div>
  )
}

function ResponseCard({ data, error, loading }) {
  if (loading) return (
    <div className="rounded border border-[#181826] bg-[#08080f] p-4">
      <Skeleton />
    </div>
  )

  if (error) return (
    <div className="rounded border border-[#181826] bg-[#08080f] px-4 py-3">
      <p className="text-[12px] text-red-400/80">{error}</p>
    </div>
  )

  if (!data) return null

  return (
    <div className="rounded border border-[#181826] bg-[#08080f] overflow-hidden">
      {/* Summary */}
      <div className="px-4 py-3 border-b border-[#181826]">
        <p className="text-[9px] tracking-[0.18em] text-[#3a3a52] uppercase mb-2">Summary</p>
        <p className="text-[12px] text-[#9898b8] leading-relaxed">{data.summary}</p>
      </div>

      {/* Ingredients table */}
      {data.ingredients?.length > 0 && (
        <div className="px-4 py-3 border-b border-[#181826]">
          <p className="text-[9px] tracking-[0.18em] text-[#3a3a52] uppercase mb-3">Relevant Ingredients</p>
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left pb-2 text-[9px] tracking-wider text-[#3a3a52] font-normal">INGREDIENT</th>
                <th className="text-left pb-2 text-[9px] tracking-wider text-[#3a3a52] font-normal">FUNCTION</th>
                <th className="text-right pb-2 text-[9px] tracking-wider text-[#3a3a52] font-normal">EVIDENCE</th>
              </tr>
            </thead>
            <tbody>
              {data.ingredients.map((ing, i) => (
                <tr key={i} className="border-t border-[#181826]">
                  <td className="py-2 pr-4 text-[11px] text-[#c8c8de] whitespace-nowrap">{ing.name}</td>
                  <td className="py-2 pr-4 text-[11px] text-[#5e5e7a] leading-snug">{ing.function}</td>
                  <td className="py-2 text-right">
                    <span className={`inline-block px-1.5 py-0.5 rounded border text-[9px] tracking-wider uppercase ${TIER_STYLE[ing.evidence_tier] ?? TIER_STYLE.emerging}`}>
                      {ing.evidence_tier}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Disclaimer */}
      <div className="px-4 py-3">
        <p className="text-[10px] text-[#3a3a52] leading-relaxed italic">
          This is educational information only. Always consult a dermatologist for personal skin advice.
        </p>
      </div>
    </div>
  )
}

export default function ChatPanel() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function submit() {
    if (!input.trim() || loading) return
    const query = input.trim()
    setInput('')
    setLoading(true)
    const id = Date.now()
    setMessages(prev => [...prev, { id, query, data: null, error: null, loading: true }])

    try {
      const r = await fetch(`${BASE}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })
      if (!r.ok) {
        const e = await r.json().catch(() => ({}))
        throw new Error(e.detail ?? `HTTP ${r.status}`)
      }
      const result = await r.json()
      setMessages(prev => prev.map(m =>
        m.id === id ? { ...m, data: result.analysis, loading: false } : m
      ))
    } catch (e) {
      setMessages(prev => prev.map(m =>
        m.id === id ? { ...m, error: e.message, loading: false } : m
      ))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages — empty until first send */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="space-y-6 py-2">
          {messages.map(msg => (
            <div key={msg.id} className="space-y-2">
              <div className="flex justify-end">
                <div className="max-w-[85%] bg-[#0d0d16] border border-[#181826] rounded px-3 py-2 text-[12px] text-[#8888aa]">
                  {msg.query}
                </div>
              </div>
              <ResponseCard data={msg.data} error={msg.error} loading={msg.loading} />
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Static input bar */}
      <div className="shrink-0 border-t border-[#181826] pt-4">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
            }}
            placeholder="Describe your skin type and concerns…"
            rows={2}
            className="flex-1 bg-[#0d0d16] border border-[#181826] rounded px-4 py-2.5 text-[13px] text-[#c8c8de] placeholder-[#252535] resize-none focus:outline-none focus:border-indigo-500/50 transition-colors"
          />
          <button
            onClick={submit}
            disabled={loading || !input.trim()}
            className="h-[52px] px-4 bg-indigo-600 text-white text-[11px] tracking-[0.12em] rounded hover:bg-indigo-500 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'ANALYZING…' : 'ANALYZE'}
          </button>
        </div>
        <p className="mt-1.5 text-[10px] text-[#252535]">enter to submit · shift+enter for new line</p>
      </div>
    </div>
  )
}
