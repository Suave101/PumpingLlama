import Link from 'next/link';
import { loadProblems } from '@/lib/problems';
import { tableOfContents } from '@/lib/textbook/book';
import { SiteNav } from '@/components/site/SiteNav';
import { LogoMark } from '@/components/site/Logo';

const STEPS = [
  {
    title: 'Read a short section',
    body: 'Each idea is followed right away by a participation activity or an animation you step through.',
  },
  {
    title: 'Build your answer in a lab',
    body: 'Drag states onto a canvas, write production rules, grow a parse tree, or pick a string to pump.',
  },
  {
    title: 'Get a counterexample',
    body: 'Your answer is compared with the target language, and you see the exact string where they disagree.',
  },
];

// Two-state DFA for "odd number of 1s", drawn as the hero illustration
function HeroAutomaton() {
  return (
    <div className="relative bg-steel-900/90 border border-steel-700 rounded-2xl p-5 shadow-[0_0_80px_-20px] shadow-arc-500/50">
      {/* HUD corner brackets */}
      <span aria-hidden="true" className="absolute -top-px -left-px w-5 h-5 border-t-2 border-l-2 border-gold-400 rounded-tl-2xl" />
      <span aria-hidden="true" className="absolute -top-px -right-px w-5 h-5 border-t-2 border-r-2 border-gold-400 rounded-tr-2xl" />
      <span aria-hidden="true" className="absolute -bottom-px -left-px w-5 h-5 border-b-2 border-l-2 border-gold-400 rounded-bl-2xl" />
      <span aria-hidden="true" className="absolute -bottom-px -right-px w-5 h-5 border-b-2 border-r-2 border-gold-400 rounded-br-2xl" />
      <div className="flex items-center justify-between text-[11px] font-mono text-steel-400 mb-2">
        <span>DFA: odd number of 1s</span>
        <span>Σ = &#123;0, 1&#125;</span>
      </div>
      <svg viewBox="0 0 360 190" className="w-full h-auto" role="img" aria-label="A two-state DFA that accepts strings with an odd number of 1s">
        <defs>
          <marker id="hero-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#e0a21b" />
          </marker>
          <marker id="hero-start" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#4fe3ea" />
          </marker>
        </defs>

        {/* start arrow */}
        <path d="M 30 105 L 72 105" stroke="#4fe3ea" strokeWidth="2.5" markerEnd="url(#hero-start)" />

        {/* q0 -> q1 and back on 1 */}
        <path d="M 120 88 Q 180 40 240 88" fill="none" stroke="#e0a21b" strokeWidth="2" markerEnd="url(#hero-arrow)" />
        <text x="180" y="52" textAnchor="middle" fill="#f0b72f" fontSize="13" fontWeight="bold" fontFamily="monospace">1</text>
        <path d="M 240 122 Q 180 170 120 122" fill="none" stroke="#e0a21b" strokeWidth="2" markerEnd="url(#hero-arrow)" />
        <text x="180" y="168" textAnchor="middle" fill="#f0b72f" fontSize="13" fontWeight="bold" fontFamily="monospace">1</text>

        {/* self-loops on 0 */}
        <path d="M 88 80 A 18 18 0 1 1 112 80" fill="none" stroke="#e0a21b" strokeWidth="2" markerEnd="url(#hero-arrow)" />
        <text x="100" y="34" textAnchor="middle" fill="#f0b72f" fontSize="13" fontWeight="bold" fontFamily="monospace">0</text>
        <path d="M 248 80 A 18 18 0 1 1 272 80" fill="none" stroke="#e0a21b" strokeWidth="2" markerEnd="url(#hero-arrow)" />
        <text x="260" y="34" textAnchor="middle" fill="#f0b72f" fontSize="13" fontWeight="bold" fontFamily="monospace">0</text>

        {/* states */}
        <circle cx="100" cy="105" r="24" fill="#1a1c21" stroke="#4fe3ea" strokeWidth="2" />
        <text x="100" y="110" textAnchor="middle" fill="#f6f6f7" fontSize="14" fontWeight="bold" fontFamily="monospace">q0</text>
        <circle cx="260" cy="105" r="29" fill="none" stroke="#c08414" strokeWidth="2" />
        <circle cx="260" cy="105" r="24" fill="#4a3210" stroke="#f0b72f" strokeWidth="2" />
        <text x="260" y="110" textAnchor="middle" fill="#f6f6f7" fontSize="14" fontWeight="bold" fontFamily="monospace">q1</text>
      </svg>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <div className="px-3 py-2 rounded-lg border bg-gold-950/40 border-gold-900/60 text-gold-300 flex justify-between font-mono">
          <span>&quot;0100&quot;</span>
          <span>✓ accepted</span>
        </div>
        <div className="px-3 py-2 rounded-lg border bg-red-950/30 border-red-900/50 text-red-300 flex justify-between font-mono">
          <span>&quot;0110&quot;</span>
          <span>✗ rejected</span>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const problems = loadProblems();
  const chapters = tableOfContents();
  const sectionCount = chapters.reduce((n, c) => n + c.sections.length, 0);

  return (
    <main className="relative isolate min-h-screen bg-steel-950 text-steel-100 px-4 sm:px-8 font-sans overflow-hidden">
      {/* Backdrop: crimson glow, arc-reactor glow and a faint HUD grid */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[760px] -z-10"
        style={{
          backgroundImage: [
            'radial-gradient(ellipse 60% 55% at 15% 0%, rgba(166, 25, 46, 0.35), transparent 70%)',
            'radial-gradient(circle at 80% 35%, rgba(31, 200, 209, 0.14), transparent 40%)',
            'linear-gradient(rgba(174, 179, 186, 0.06) 1px, transparent 1px)',
            'linear-gradient(90deg, rgba(174, 179, 186, 0.06) 1px, transparent 1px)',
          ].join(', '),
          backgroundSize: 'auto, auto, 40px 40px, 40px 40px',
          maskImage: 'linear-gradient(to bottom, black 60%, transparent)',
        }}
      />
      <SiteNav current="home" />

      {/* Hero */}
      <section className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center pt-10 pb-20">
        <div className="flex flex-col gap-6">
          <span className="self-start text-xs font-semibold uppercase tracking-wider text-crimson-200 bg-crimson-950/70 border border-crimson-700/60 px-3 py-1 rounded-full">
            Automata &amp; formal languages practice
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Build the machine.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-300 via-gold-500 to-crimson-500">
              See exactly where it breaks.
            </span>
          </h1>
          <p className="text-steel-400 text-base sm:text-lg max-w-xl leading-relaxed">
            An interactive automata theory textbook. Read a little, practice right away, then build DFAs, grammars,
            pushdown automata and proofs in labs that show you a string that proves your answer wrong. It works on its
            own or inside Canvas.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/book"
              className="px-5 py-3 rounded-lg bg-crimson-600 hover:bg-crimson-500 text-white font-semibold transition shadow-lg"
            >
              Start reading
            </Link>
            <Link
              href="/problems"
              className="px-5 py-3 rounded-lg border border-steel-700 hover:border-gold-500/60 text-steel-200 hover:text-white font-semibold transition"
            >
              Browse {problems.length} labs &rarr;
            </Link>
          </div>
          <dl className="flex gap-8 pt-2">
            <div>
              <dt className="text-xs text-steel-500">Chapters</dt>
              <dd className="text-2xl font-bold text-white font-mono">{chapters.length}</dd>
            </div>
            <div>
              <dt className="text-xs text-steel-500">Sections</dt>
              <dd className="text-2xl font-bold text-white font-mono">{sectionCount}</dd>
            </div>
            <div>
              <dt className="text-xs text-steel-500">Labs</dt>
              <dd className="text-2xl font-bold text-white font-mono">{problems.length}</dd>
            </div>
          </dl>
        </div>
        <HeroAutomaton />
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto pb-20">
        <h2 className="text-2xl font-bold text-white mb-6">How it works</h2>
        <ol className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {STEPS.map((step, i) => (
            <li key={step.title} className="bg-steel-900 border border-steel-800 rounded-xl p-5 flex flex-col gap-2">
              <span className="w-8 h-8 rounded-full bg-crimson-950 border border-crimson-600/70 text-gold-300 font-mono font-bold flex items-center justify-center text-sm">
                {i + 1}
              </span>
              <h3 className="text-base font-bold text-white">{step.title}</h3>
              <p className="text-sm text-steel-400 leading-relaxed">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Chapters */}
      <section className="max-w-6xl mx-auto pb-20">
        <div className="flex items-end justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold text-white">Chapters</h2>
          <Link href="/book" className="text-sm text-gold-400 hover:text-gold-300 font-medium">
            Table of contents &rarr;
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {chapters.map((chapter) => (
            <Link
              key={chapter.id}
              href={chapter.sections[0]?.href ?? '/book'}
              className="bg-steel-900 border border-steel-800 hover:border-gold-500/50 rounded-xl p-5 flex flex-col gap-3 transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl font-mono font-bold text-gold-400">{chapter.number}</span>
                <span className="text-xs bg-steel-800 text-steel-300 px-2 py-0.5 rounded-full font-mono">
                  {chapter.sections.length} sections
                </span>
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-gold-300 transition">{chapter.title}</h3>
              <p className="text-xs text-steel-400 leading-relaxed">{chapter.summary}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Instructors */}
      <section className="max-w-6xl mx-auto pb-16">
        <div className="bg-gradient-to-br from-steel-900 via-steel-900 to-crimson-950 border border-crimson-900/60 rounded-2xl p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-bold text-white">Teaching a course?</h2>
            <p className="text-sm text-steel-400 mt-1 max-w-xl">
              Add any section to Canvas as a graded assignment through LTI 1.3. Grades for activities and labs go to the
              gradebook as students work. You can also write your own labs in the Professor Studio.
            </p>
          </div>
          <Link
            href="/instructors"
            className="shrink-0 px-5 py-3 rounded-lg border border-gold-600/60 text-gold-300 hover:bg-gold-950/60 font-semibold transition"
          >
            Set up Canvas
          </Link>
        </div>
      </section>

      <footer className="max-w-6xl mx-auto border-t border-steel-800 py-6 text-xs text-steel-500 flex justify-between">
        <span className="flex items-center gap-2">
          <LogoMark className="w-4 h-4" />
          Pumping Llama
        </span>
        <span>Automata theory practice</span>
      </footer>
    </main>
  );
}
