import { Link } from 'react-router-dom'

export default function Disclaimer() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(180deg, #9fb9c8 0%, #b5cad6 18%, #ccdae0 35%, #e5e9ec 50%, #f0e4d8 68%, #f4d6c0 84%, #f2caa8 100%)' }}
    >
      <nav className="shrink-0 flex items-center justify-between px-6 py-4">
        <Link to="/" className="text-xl font-semibold text-[#2d3748] tracking-tight hover:opacity-80 transition-opacity">
          DermaMind
        </Link>
      </nav>

      <main className="flex-1 px-4 py-10 max-w-2xl mx-auto w-full">
        <h1 className="text-3xl font-bold text-[#2d3748] mb-2">Disclaimer</h1>
        <p className="text-sm text-[#718096] mb-8">Last updated: 2026</p>

        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-100 rounded-2xl px-6 py-5">
            <p className="text-sm text-amber-700/80 leading-relaxed">
              ⚠️ DermaMind provides general skincare science information for <strong>educational purposes only</strong>. It is not a substitute for professional medical advice, diagnosis, or treatment.
            </p>
          </div>

          {[
            {
              title: 'Not Medical Advice',
              body: 'The information on DermaMind is intended for general informational purposes only. Nothing on this platform should be construed as professional medical advice or a recommendation to use any specific product or treatment.',
            },
            {
              title: 'Consult a Professional',
              body: 'Always seek the advice of a qualified dermatologist or other healthcare provider with any questions you may have regarding a skin condition or treatment. Never disregard professional advice because of something you read on DermaMind.',
            },
            {
              title: 'No Guarantees',
              body: 'Individual skin types and conditions vary. Results mentioned in any content are not guaranteed and may not apply to your specific situation.',
            },
            {
              title: 'External Links',
              body: 'DermaMind may link to third-party articles and research. We do not endorse, verify, or take responsibility for the accuracy of external content.',
            },
            {
              title: 'Limitation of Liability',
              body: 'DermaMind and its creators, Xueying Wu, shall not be held liable for any damages arising from use of this platform or reliance on any information provided herein.',
            },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-white/70 px-6 py-5">
              <h2 className="text-sm font-semibold text-[#2d3748] mb-2">{s.title}</h2>
              <p className="text-sm text-[#4a5568] leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="shrink-0 py-3 text-center">
        <p className="text-[11px] text-[#4a5568]/40">
          © 2026 Xueying Wu. All rights reserved.{' '}
          <Link to="/" className="underline hover:text-[#4a5568]/70 transition-colors">Back to app</Link>
        </p>
      </footer>
    </div>
  )
}
