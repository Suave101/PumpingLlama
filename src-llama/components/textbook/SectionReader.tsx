'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import type { Problem } from '@/types/automata';
import type { ActivityBlock, Block, Section } from '@/lib/textbook/types';
import { activityPoints, gradeActivity, gradeSection, isActivity } from '@/lib/textbook/grading';
import { saveSectionScore, useSectionResponses } from '@/lib/textbook/progress';
import { syncScore, type SyncResult } from '@/lib/lti/client';
import { Markdown } from './Markdown';
import { ActivityCard, ChoiceActivity, MembershipActivity, ShortAnswerActivity } from './Activities';
import { TraceAnimation } from './TraceAnimation';
import { LabActivity } from './LabActivity';
import { useHydrated, useLtiSession } from './useLtiSession';

type NavLink = { href: string; title: string } | null;

type SectionReaderProps = {
  sectionKey: string;
  number: string;
  chapterTitle: string;
  section: Section;
  problems: Record<string, Problem>;
  prev: NavLink;
  next: NavLink;
};

const KIND_LABEL: Record<ActivityBlock['type'], string> = {
  choice: 'Participation activity',
  membership: 'Participation activity',
  short: 'Participation activity',
  trace: 'Animation',
  lab: 'Lab',
};

const CALLOUT_STYLE = {
  definition: 'border-arc-700/70 bg-arc-950/30',
  theorem: 'border-gold-700/70 bg-gold-950/30',
  note: 'border-steel-700 bg-steel-900',
};

export const SectionReader: React.FC<SectionReaderProps> = ({
  sectionKey,
  number,
  chapterTitle,
  section,
  problems,
  prev,
  next,
}) => {
  const [responses, setResponse] = useSectionResponses(sectionKey);
  const hydrated = useHydrated();
  const lti = useLtiSession();
  const [sync, setSync] = useState<SyncResult | 'pending' | null>(null);

  // Labs re-run the grader on saved submissions, so only regrade when answers change
  const grade = useMemo(() => gradeSection(section, responses, problems), [section, responses, problems]);
  const percent = grade.total ? Math.round((grade.earned / grade.total) * 100) : 0;
  const syncsToCanvas = Boolean(lti?.gradePassback && lti.sectionKey === sectionKey);

  // Keep the best attempt, then record the score and (inside Canvas) send the answers to be graded
  const respond = (block: ActivityBlock, value: unknown) => {
    const before = gradeActivity(block, responses[block.id], problems);
    const after = gradeActivity(block, value, problems);
    if (after < before) return;
    setResponse(block.id, value);

    const updated = { ...responses, [block.id]: value };
    const { earned, total } = gradeSection(section, updated, problems);
    saveSectionScore(sectionKey, { earned, total });

    if (syncsToCanvas && lti && after > before) {
      setSync('pending');
      syncScore(lti, sectionKey, updated).then(setSync);
    }
  };

  // Activities are numbered within the section, like 3.1.2
  const labels = useMemo(
    () => new Map(section.blocks.filter(isActivity).map((b, i) => [b.id, `${number}.${i + 1}`])),
    [section, number]
  );

  const renderBlock = (block: Block, i: number) => {
    if (block.type === 'text') return <Markdown key={i}>{block.md}</Markdown>;
    if (block.type === 'callout') {
      return (
        <aside key={i} className={`border-l-4 rounded-r-lg px-5 py-4 ${CALLOUT_STYLE[block.kind]}`}>
          <p className="text-xs font-semibold uppercase tracking-wider text-steel-400 mb-2">
            {block.kind}
            {block.title ? `: ${block.title}` : ''}
          </p>
          <Markdown>{block.md}</Markdown>
        </aside>
      );
    }
    if (!isActivity(block)) return null;

    const label = labels.get(block.id) ?? number;
    const response = responses[block.id];
    const done = (grade.perActivity[block.id] ?? 0) >= 1;
    const onRespond = (value: unknown) => respond(block, value);

    return (
      <ActivityCard key={block.id} label={label} kind={KIND_LABEL[block.type]} done={done} points={activityPoints(block)}>
        {!hydrated ? (
          <p className="text-sm text-steel-500">Loading activity…</p>
        ) : block.type === 'choice' ? (
          <ChoiceActivity block={block} response={response as number | undefined} onRespond={onRespond} />
        ) : block.type === 'membership' ? (
          <MembershipActivity block={block} response={response as boolean[] | undefined} onRespond={onRespond} />
        ) : block.type === 'short' ? (
          <ShortAnswerActivity block={block} response={response as string | undefined} onRespond={onRespond} />
        ) : block.type === 'trace' ? (
          <TraceAnimation block={block} watched={response === true} onWatched={() => onRespond(true)} />
        ) : (
          <LabActivity problem={problems[block.problem]} passed={done} onSubmit={onRespond} />
        )}
      </ActivityCard>
    );
  };

  return (
    <article className="flex flex-col gap-8 min-w-0">
      <header className="flex flex-col gap-3 border-b border-steel-800 pb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-crimson-300">{chapterTitle}</p>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          <span className="font-mono text-gold-400 mr-3">{number}</span>
          {section.title}
        </h1>
        {grade.total > 0 && (
          <div className="flex items-center gap-3" aria-label={`Section progress ${percent}%`}>
            <div className="flex-1 h-2 rounded-full bg-steel-800 overflow-hidden">
              <div className="h-full bg-gold-500 transition-all" style={{ width: `${hydrated ? percent : 0}%` }} />
            </div>
            <span className="text-xs font-mono text-steel-400 whitespace-nowrap">
              {hydrated ? `${grade.earned} / ${grade.total} pts` : `${grade.total} pts`}
            </span>
          </div>
        )}
        {lti && hydrated && (
          <p className="text-xs text-steel-400">
            <span className="text-arc-400">●</span> Opened from Canvas{lti.contextTitle ? ` (${lti.contextTitle})` : ''}.{' '}
            {syncsToCanvas
              ? sync === 'pending'
                ? 'Sending your grade…'
                : sync && !sync.ok
                  ? <span className="text-red-300">{sync.error}</span>
                  : sync?.ok
                    ? `Grade sent to Canvas: ${sync.earned} / ${sync.total}.`
                    : 'Your grade is sent to Canvas as you complete activities.'
              : 'This page isn’t a graded Canvas assignment, so progress is saved in this browser only.'}
          </p>
        )}
      </header>

      {section.blocks.map(renderBlock)}

      <nav className="flex justify-between gap-4 border-t border-steel-800 pt-6 text-sm">
        {prev ? (
          <Link href={prev.href} className="text-steel-400 hover:text-white">
            &larr; {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={next.href} className="text-gold-400 hover:text-gold-300 font-medium text-right">
            {next.title} &rarr;
          </Link>
        )}
      </nav>
    </article>
  );
};
