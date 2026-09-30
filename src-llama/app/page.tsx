import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import { Problem } from '@/types/automata';

const CATEGORY_META: Record<string, { title: string; description: string; icon: string }> = {
  DFA: {
    title: 'Deterministic Finite Automata',
    description: 'Construct state machines with deterministic transitions for regular languages.',
    icon: '⚡',
  },
  NFA: {
    title: 'Nondeterministic Finite Automata',
    description: 'Design non-deterministic state models featuring non-deterministic branches & ε-transitions.',
    icon: '🔀',
  },
  REGEX: {
    title: 'Regular Expressions',
    description: 'Write patterns using union, concatenation, and Kleene star operators.',
    icon: '🔍',
  },
  CFG: {
    title: 'Context-Free Grammars',
    description: 'Define production rules for context-free languages and non-regular structures.',
    icon: '🌳',
  },
  PDA: {
    title: 'Pushdown Automata',
    description: 'Build non-deterministic stack machines to accept context-free languages.',
    icon: '🥞',
  },
  NORMAL_FORMS: {
    title: 'Grammar Normal Forms (CNF / GNF)',
    description: 'Transform context-free grammars into Chomsky and Greibach Normal Forms.',
    icon: '📐',
  },
  PROOFS: {
    title: 'Pumping Lemma Proofs',
    description: 'Prove languages are non-regular or non-context-free through adversarial pumping length games.',
    icon: '🪀',
  },
  PARSING: {
    title: 'Parse Trees & Ambiguity',
    description: 'Construct syntax trees and prove grammar ambiguity using leftmost derivations.',
    icon: '🌿',
  },
};

function resolveCategoryKey(type: string): string {
  const upper = type.toUpperCase();
  if (upper.includes('PDA')) return 'PDA';
  if (upper.includes('CNF') || upper.includes('GNF')) return 'NORMAL_FORMS';
  if (upper.includes('PUMPING')) return 'PROOFS';
  if (upper.includes('AMBIGUITY') || upper.includes('PARSE')) return 'PARSING';
  if (upper.includes('REGEX')) return 'REGEX';
  if (upper.includes('NFA')) return 'NFA';
  if (upper.includes('DFA')) return 'DFA';
  if (upper.includes('CFG')) return 'CFG';
  return upper;
}

export default async function HomePage() {
  const problemsDir = path.join(process.cwd(), 'public/problems');
  let problemList: { slug: string; problem: Problem }[] = [];

  if (fs.existsSync(problemsDir)) {
    const files = fs.readdirSync(problemsDir).filter((f) => f.endsWith('.json'));
    problemList = files.map((file) => {
      const content = fs.readFileSync(path.join(problemsDir, file), 'utf-8');
      return {
        slug: file.replace(/\.json$/, ''),
        problem: JSON.parse(content) as Problem,
      };
    });
  }

  const groupedProblems = problemList.reduce((acc, item) => {
    const key = resolveCategoryKey(item.problem.type || 'OTHER');
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, typeof problemList>);

  const categoryKeys = Object.keys(groupedProblems).sort();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        <header className="border-b border-slate-800 pb-6 flex justify-between items-end">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-3xl">🦙</span>
              <h1 className="text-4xl font-extrabold text-white tracking-tight">Pumping Llama</h1>
            </div>
            <p className="text-slate-400 mt-2 text-sm max-w-xl">
              Automated formal languages and automata theory practice platform with instant counter-example feedback.
            </p>
          </div>
        </header>

        <div className="flex flex-col gap-10">
          {categoryKeys.map((catKey) => {
            const meta = CATEGORY_META[catKey] || {
              title: `${catKey} Challenges`,
              description: `Practice challenges under ${catKey}.`,
              icon: '📌',
            };
            const items = groupedProblems[catKey];

            return (
              <section key={catKey} className="flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{meta.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-white">{meta.title}</h2>
                        <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
                          {items.length} {items.length === 1 ? 'problem' : 'problems'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{meta.description}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map(({ slug, problem }) => (
                    <Link
                      key={slug}
                      href={`/problem/${slug}`}
                      className="bg-slate-900 border border-slate-800/90 hover:border-emerald-500/50 p-5 rounded-xl transition flex flex-col justify-between gap-3 group"
                    >
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition">
                            {problem.title}
                          </h3>
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/50 px-2 py-0.5 rounded uppercase font-mono shrink-0">
                            {problem.type}
                          </span>
                        </div>
                        <p className="text-slate-400 text-xs mt-2 line-clamp-2 leading-relaxed">
                          {problem.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-slate-800/60 font-mono">
                        <span>Σ = &#123;{problem.alphabet?.join(', ')}&#125;</span>
                        <span className="text-emerald-400 font-sans font-medium group-hover:translate-x-1 transition-transform inline-block">
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