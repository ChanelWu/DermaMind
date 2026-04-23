export default function Terms() {
  const sections = [
    {
      title: '1. Educational Purpose Only',
      body: 'DermaMind is provided for educational and informational purposes only. It does not constitute medical advice.',
    },
    {
      title: '2. No Medical Relationship',
      body: 'Use of DermaMind does not create a doctor-patient or any professional relationship.',
    },
    {
      title: '3. Accuracy of Information',
      body: 'While we strive for accuracy, skincare science evolves. Information may not reflect the most current research.',
    },
    {
      title: '4. Limitation of Liability',
      body: 'DermaMind and its creators are not liable for any decisions made based on information provided by this platform.',
    },
    {
      title: '5. Intellectual Property',
      body: 'All content, design, and code is owned by Xueying Wu © 2026. Unauthorized reproduction is prohibited.',
    },
    {
      title: '6. Third Party Links',
      body: 'Articles linked in Latest News are third party content. DermaMind does not own or verify external content.',
    },
  ]

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(180deg, #9fb9c8 0%, #b5cad6 18%, #ccdae0 35%, #e5e9ec 50%, #f0e4d8 68%, #f4d6c0 84%, #f2caa8 100%)' }}
    >
      <nav className="shrink-0 flex items-center justify-between px-6 py-4">
        <a href="/" className="text-xl font-semibold text-[#2d3748] tracking-tight hover:opacity-80 transition-opacity">
          DermaMind
        </a>
      </nav>

      <main className="flex-1 px-4 py-10 max-w-2xl mx-auto w-full">
        <h1 className="text-3xl font-bold text-[#2d3748] mb-2">Terms of Use</h1>
        <p className="text-sm text-[#718096] mb-8">Last updated: 2026</p>

        <div className="space-y-4">
          {sections.map((s, i) => (
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
          <a href="/" className="underline hover:text-[#4a5568]/70 transition-colors">Back to app</a>
        </p>
      </footer>
    </div>
  )
}
