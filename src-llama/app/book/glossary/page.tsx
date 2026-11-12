import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteNav } from '@/components/site/SiteNav';
import { ReadingSurface } from '@/components/textbook/ReadingSurface';
import { Markdown } from '@/components/textbook/Markdown';
import { glossary } from '@/lib/textbook/book';
import { termSlug } from '@/lib/textbook/slug';

export const metadata: Metadata = { title: 'Glossary · Pumping Llama' };

// Book index: every titled definition and theorem, grouped by first letter
export default function GlossaryPage() {
  const entries = glossary();
  const letters = [...new Set(entries.map((e) => e.term[0].toUpperCase()))];

  return (
    <ReadingSurface>
      <SiteNav current="book" />
      <div className="max-w-3xl mx-auto pt-6 pb-20 flex flex-col gap-8">
        <header className="flex flex-col gap-3">
          <Link href="/book" className="text-xs font-semibold text-gold-400 hover:text-gold-300">
            &larr; Table of contents
          </Link>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Glossary</h1>
          <p className="text-steel-400">
            Every definition and theorem in the book, with a link to the section that introduces it.
          </p>
          <nav aria-label="Jump to letter" className="flex flex-wrap gap-1">
            {letters.map((l) => (
              <a
                key={l}
                href={`#letter-${l}`}
                className="w-8 h-8 flex items-center justify-center rounded-md border border-steel-800 text-sm text-steel-300 hover:text-white hover:border-steel-600"
              >
                {l}
              </a>
            ))}
          </nav>
        </header>

        {letters.map((letter) => (
          <section key={letter} id={`letter-${letter}`} className="flex flex-col gap-4 scroll-mt-6">
            <h2 className="text-lg font-bold text-gold-400 font-mono border-b border-steel-800 pb-1">{letter}</h2>
            {entries
              .filter((e) => e.term[0].toUpperCase() === letter)
              .map((entry) => (
                <article key={entry.href} id={termSlug(entry.term)} className="flex flex-col gap-2 scroll-mt-6">
                  <h3 className="text-base font-bold text-white">
                    {entry.term}
                    <span className="ml-2 align-middle text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border border-steel-700 text-steel-400">
                      {entry.kind}
                    </span>
                  </h3>
                  <Markdown>{entry.md}</Markdown>
                  <Link href={entry.href} className="self-start text-sm text-gold-400 hover:text-gold-300">
                    Introduced in {entry.section} &rarr;
                  </Link>
                </article>
              ))}
          </section>
        ))}
      </div>
    </ReadingSurface>
  );
}
