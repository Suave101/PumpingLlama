import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import { Problem } from '@/types/automata';

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

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 p-8 font-sans">
      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        <header className="border-b border-slate-800 pb-6">
          <h1 className="text-4xl font-bold text-white tracking-tight">Automata Practice Studio</h1>
          <p className="text-slate-400 mt-2">Select a challenge from `public/problems` to get started.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {problemList.map(({ slug, problem }) => (
            <Link
              key={slug}
              href={`/problem/${slug}`}
              className="bg-slate-950 border border-slate-800 hover:border-emerald-500/50 p-6 rounded-xl transition flex flex-col justify-between gap-4 group"
            >
              <div>
                <span className="text-xs uppercase tracking-widest text-emerald-400 font-semibold">
                  {problem.type}
                </span>
                <h2 className="text-xl font-bold text-white mt-1 group-hover:text-emerald-300 transition">
                  {problem.title}
                </h2>
                <p className="text-slate-400 text-sm mt-2 line-clamp-2">
                  {problem.description}
                </p>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-900">
                <span>Alphabet: {problem.alphabet.join(', ')}</span>
                <span className="text-emerald-400 font-medium group-hover:translate-x-1 transition-transform inline-block">
                  Open Problem &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}