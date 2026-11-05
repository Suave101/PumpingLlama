import Link from 'next/link';
import type { Metadata } from 'next';
import { getCategoryMeta, groupByCategory, loadProblems } from '@/lib/problems';
import { SiteNav } from '@/components/site/SiteNav';

export const metadata: Metadata = {
  title: 'Problems | Pumping Llama',
  description: 'Every Pumping Llama practice problem, grouped by topic.',
};

export default function ProblemsPage() {
  const groups = groupByCategory(loadProblems());

  return (
    <main className="min-h-screen bg-steel-950 text-steel-100 px-4 sm:px-8 pb-16 font-sans">
      <SiteNav current="problems" />
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        <header className="border-b border-steel-800 pb-6">
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Problems</h1>
          <p className="text-steel-400 mt-2 text-sm max-w-xl">
            Pick a problem, build your answer, and get instant counter-example feedback.
          </p>
        </header>

        <div className="flex flex-col gap-10">
          {groups.map(({ key, items }) => {
            const meta = getCategoryMeta(key);

            return (
              <section key={key} id={key} className="flex flex-col gap-4 scroll-mt-6">
                <div className="flex items-center justify-between border-b border-steel-800/80 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{meta.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-white">{meta.title}</h2>
                        <span className="text-xs bg-steel-800 text-steel-300 px-2 py-0.5 rounded-full font-mono">
                          {items.length} {items.length === 1 ? 'problem' : 'problems'}
                        </span>
                      </div>
                      <p className="text-xs text-steel-400 mt-0.5">{meta.description}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map(({ slug, problem }) => (
                    <Link
                      key={slug}
                      href={`/problem/${slug}`}
                      className="bg-steel-900 border border-steel-800/90 hover:border-gold-500/50 p-5 rounded-xl transition flex flex-col justify-between gap-3 group"
                    >
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="text-base font-bold text-white group-hover:text-gold-300 transition">
                            {problem.title}
                          </h3>
                          <span className="text-[10px] font-bold text-gold-400 bg-gold-950/80 border border-gold-800/50 px-2 py-0.5 rounded uppercase font-mono shrink-0">
                            {problem.type}
                          </span>
                        </div>
                        <p className="text-steel-400 text-xs mt-2 line-clamp-2 leading-relaxed">
                          {problem.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-steel-500 pt-3 border-t border-steel-800/60 font-mono">
                        <span>Σ = &#123;{problem.alphabet?.join(', ')}&#125;</span>
                        <span className="text-gold-400 font-sans font-medium group-hover:translate-x-1 transition-transform inline-block">
                          Solve &rarr;
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}
