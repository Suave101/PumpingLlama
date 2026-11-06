'use client';

import React from 'react';
import Link from 'next/link';
import type { ContentsChapter } from '@/lib/textbook/book';
import { useAllScores } from '@/lib/textbook/progress';
import { useHydrated } from './useLtiSession';

const ProgressDot: React.FC<{ earned?: number; total?: number }> = ({ earned = 0, total = 0 }) => {
  const state = total > 0 && earned >= total ? 'done' : earned > 0 ? 'started' : 'none';
  return (
    <span
      aria-label={state === 'done' ? 'Complete' : state === 'started' ? 'In progress' : 'Not started'}
      className={`shrink-0 w-2.5 h-2.5 rounded-full border ${
        state === 'done' ? 'bg-gold-400 border-gold-400' : state === 'started' ? 'border-gold-400' : 'border-steel-600'
      }`}
    />
  );
};

// Sidebar on section pages (compact) and the full table of contents on /book
export const BookContents: React.FC<{ chapters: ContentsChapter[]; currentKey?: string; compact?: boolean }> = ({
  chapters,
  currentKey,
  compact = false,
}) => {
  const keys = React.useMemo(() => chapters.flatMap((c) => c.sections.map((s) => s.key)), [chapters]);
  const scores = useAllScores(keys);
  const hydrated = useHydrated();

  return (
    <ol className={compact ? 'flex flex-col gap-5' : 'flex flex-col gap-6'}>
      {chapters.map((chapter) => (
        <li key={chapter.id} className={compact ? '' : 'bg-steel-900 border border-steel-800 rounded-xl p-5'}>
          <h2 className={compact ? 'text-xs font-semibold uppercase tracking-wider text-steel-500 mb-2' : 'text-lg font-bold text-white'}>
            <span className="font-mono text-gold-400 mr-2">{chapter.number}</span>
            {chapter.title}
          </h2>
          {!compact && <p className="text-sm text-steel-400 mt-1 mb-4">{chapter.summary}</p>}
          <ol className="flex flex-col gap-0.5">
            {chapter.sections.map((s) => {
              const current = s.key === currentKey;
              const score = hydrated ? scores[s.key] : undefined;
              return (
                <li key={s.key}>
                  <Link
                    href={s.href}
                    aria-current={current ? 'page' : undefined}
                    className={`flex items-center gap-3 rounded-md px-2 py-1.5 text-sm transition ${
                      current ? 'bg-steel-800 text-white' : 'text-steel-300 hover:text-white hover:bg-steel-900'
                    }`}
                  >
                    <span className="font-mono text-xs text-steel-500 w-8 shrink-0">{s.number}</span>
                    <span className="flex-1 min-w-0">{s.title}</span>
                    {s.activities > 0 && <ProgressDot earned={score?.earned} total={score?.total} />}
                  </Link>
                </li>
              );
            })}
          </ol>
        </li>
      ))}
    </ol>
  );
};
