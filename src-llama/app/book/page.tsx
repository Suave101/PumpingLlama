import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteNav } from '@/components/site/SiteNav';
import { BookContents } from '@/components/textbook/BookContents';
import { BOOK, COMPANION_READING_URL, tableOfContents } from '@/lib/textbook/book';

export const metadata: Metadata = { title: `${BOOK.title} · Pumping Llama` };

export default function BookPage() {
  const contents = tableOfContents();
  const first = contents[0]?.sections[0];

  return (
    <main className="min-h-screen bg-steel-950 text-steel-100 px-4 sm:px-8 font-sans">
      <SiteNav current="book" />
      <div className="max-w-4xl mx-auto pt-6 pb-20 flex flex-col gap-8">
        <header className="flex flex-col gap-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-crimson-300">Interactive textbook</p>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">{BOOK.title}</h1>
          <p className="text-steel-400 max-w-2xl leading-relaxed">
            Short readings with participation activities after each idea, animations you can step through, and
            auto-graded labs at the end of each chapter. Progress is saved in your browser, and grades go to Canvas
            when your course links a section as an assignment.
          </p>
          <p className="text-sm text-steel-500 max-w-2xl">
            The chapters follow the order of Jeff Erickson&apos;s{' '}
            <a href={COMPANION_READING_URL} className="text-gold-400 hover:text-gold-300 underline underline-offset-2">
              Models of Computation
            </a>{' '}
            lecture notes, which make good companion reading.
          </p>
          {first && (
            <Link
              href={first.href}
              className="self-start px-5 py-3 rounded-lg bg-crimson-600 hover:bg-crimson-500 text-white font-semibold transition"
            >
              Start with {first.number} {first.title}
            </Link>
          )}
        </header>
        <BookContents chapters={contents} />
      </div>
    </main>
  );
}
