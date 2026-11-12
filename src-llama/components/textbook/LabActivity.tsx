'use client';

import React, { useState } from 'react';
import type { Problem } from '@/types/automata';
import ProblemWorkspace, { type Submission } from '@/components/workspace/ProblemWorkspace';
import { Markdown } from './Markdown';

type LabProps = { problem: Problem | undefined; passed: boolean; onSubmit: (submission: Submission) => void };

// A graded problem inside the reading. The workspace mounts only when opened,
// so a section with many labs stays light.
export const LabActivity: React.FC<LabProps> = ({ problem, passed, onSubmit }) => {
  const [open, setOpen] = useState(false);

  if (!problem) return <p className="text-sm text-red-300">This lab&apos;s problem file is missing.</p>;

  return (
    <>
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-white">{problem.title}</h3>
        <div className="text-sm text-steel-400">
          <Markdown inline>{problem.description}</Markdown>
        </div>
      </div>
      {open ? (
        // The editors are drawn for a dark background, so a lab keeps the night palette on paper pages
        <div className="reading-night rounded-xl bg-steel-950 text-steel-100 p-4 -mx-1">
          <ProblemWorkspace problem={problem} embedded onSubmit={(submission) => onSubmit(submission)} />
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="self-start px-4 py-2 rounded-lg border border-gold-600/60 text-gold-300 hover:bg-gold-950/60 text-sm font-semibold transition"
        >
          {passed ? 'Reopen lab' : 'Start lab'}
        </button>
      )}
    </>
  );
};
