'use client';

import React, { useState } from 'react';
import type { ChoiceBlock, MembershipBlock, ShortAnswerBlock } from '@/lib/textbook/types';
import { Markdown } from './Markdown';

type ActivityCardProps = {
  label: string;
  kind: string;
  done: boolean;
  points: number;
  children: React.ReactNode;
};

// Frame shared by every participation activity and lab
export const ActivityCard: React.FC<ActivityCardProps> = ({ label, kind, done, points, children }) => (
  <section className="border border-steel-800 rounded-xl bg-steel-900/70 overflow-hidden">
    <header className="flex items-center justify-between gap-3 px-4 py-2 border-b border-steel-800 bg-steel-900">
      <span className="text-xs font-semibold uppercase tracking-wider text-steel-400">
        <span className="font-mono text-gold-400 mr-2">{label}</span>
        {kind}
      </span>
      <span
        className={`text-xs font-mono px-2 py-0.5 rounded-full border ${
          done ? 'border-gold-500/60 text-gold-300 bg-gold-950/50' : 'border-steel-700 text-steel-500'
        }`}
      >
        {done ? '✓ ' : ''}
        {points} {points === 1 ? 'pt' : 'pts'}
      </span>
    </header>
    <div className="p-4 flex flex-col gap-4">{children}</div>
  </section>
);

// onRespond saves an attempt; the reader keeps whichever attempt earns the most credit
type ActivityProps<B, R> = { block: B; response: R | undefined; onRespond: (value: R) => void };

export const ChoiceActivity: React.FC<ActivityProps<ChoiceBlock, number>> = ({ block, response, onRespond }) => {
  // The saved answer counts for credit; a fresh click shows its explanation
  const [picked, setPicked] = useState<number | null>(response ?? null);
  const pickedChoice = picked !== null ? block.choices[picked] : null;

  return (
    <>
      <Markdown inline>{block.prompt}</Markdown>
      <div className="flex flex-col gap-2" role="radiogroup">
        {block.choices.map((choice, i) => {
          const selected = picked === i;
          const tone = !selected
            ? 'border-steel-700 hover:border-steel-500'
            : choice.correct
              ? 'border-gold-500 bg-gold-950/40'
              : 'border-red-500/70 bg-red-950/30';
          return (
            <button
              key={i}
              role="radio"
              aria-checked={selected}
              onClick={() => {
                setPicked(i);
                onRespond(i);
              }}
              className={`text-left px-3 py-2 rounded-lg border transition ${tone}`}
            >
              <Markdown inline>{choice.text}</Markdown>
            </button>
          );
        })}
      </div>
      {pickedChoice && (
        <div className={`text-sm ${pickedChoice.correct ? 'text-gold-300' : 'text-red-300'}`}>
          {/* Explanations for correct choices already open with "Right." */}
          <Markdown inline>{pickedChoice.correct ? pickedChoice.explain : `Not quite. ${pickedChoice.explain}`}</Markdown>
        </div>
      )}
    </>
  );
};

const display = (w: string) => (w === '' ? 'ε' : w);

export const MembershipActivity: React.FC<ActivityProps<MembershipBlock, boolean[]>> = ({ block, response, onRespond }) => {
  const [answers, setAnswers] = useState<(boolean | null)[]>(() => response ?? block.strings.map(() => null));
  const [checked, setChecked] = useState(Boolean(response));
  const allAnswered = answers.every((a) => a !== null);
  const allCorrect = block.strings.every((s, i) => answers[i] === s.inL);

  const choose = (i: number, value: boolean) => {
    setAnswers((prev) => prev.map((a, j) => (j === i ? value : a)));
    setChecked(false);
  };

  return (
    <>
      <Markdown inline>{block.prompt}</Markdown>
      <ul className="flex flex-col gap-1.5">
        {block.strings.map((s, i) => {
          const wrong = checked && answers[i] !== s.inL;
          return (
            <li
              key={i}
              className={`flex items-center justify-between gap-3 px-3 py-1.5 rounded-lg border ${
                wrong ? 'border-red-500/60 bg-red-950/20' : 'border-steel-800'
              }`}
            >
              <code className="font-mono text-steel-100">{display(s.w)}</code>
              <div className="flex gap-1.5">
                {[true, false].map((value) => (
                  <button
                    key={String(value)}
                    onClick={() => choose(i, value)}
                    aria-pressed={answers[i] === value}
                    className={`text-xs px-2.5 py-1 rounded-md border transition ${
                      answers[i] === value
                        ? 'border-arc-500 bg-arc-950 text-arc-200'
                        : 'border-steel-700 text-steel-400 hover:text-white'
                    }`}
                  >
                    {value ? 'In L' : 'Not in L'}
                  </button>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            setChecked(true);
            if (allAnswered) onRespond(answers as boolean[]);
          }}
          className="px-4 py-1.5 rounded-lg bg-crimson-600 hover:bg-crimson-500 text-white text-sm font-medium transition"
        >
          Check
        </button>
        {checked && !allAnswered && <span className="text-sm text-steel-400">Answer every string first.</span>}
        {checked && allAnswered && (
          <span className={`text-sm ${allCorrect ? 'text-gold-300' : 'text-red-300'}`}>
            {allCorrect ? 'All correct.' : 'Some answers are wrong (highlighted). Try again.'}
          </span>
        )}
      </div>
    </>
  );
};

const normalize = (s: string) => s.replace(/\s+/g, '').toLowerCase();

export const ShortAnswerActivity: React.FC<ActivityProps<ShortAnswerBlock, string>> = ({ block, response, onRespond }) => {
  const [value, setValue] = useState(response ?? '');
  const [checked, setChecked] = useState(Boolean(response));
  const correct = block.answers.some((a) => normalize(a) === normalize(value));

  return (
    <>
      <Markdown inline>{block.prompt}</Markdown>
      <form
        className="flex flex-wrap items-center gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          setChecked(true);
          if (value.trim()) onRespond(value);
        }}
      >
        <input
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setChecked(false);
          }}
          aria-label="Your answer"
          className="flex-1 min-w-40 bg-steel-950 border border-steel-700 focus:border-arc-500 outline-none rounded-lg px-3 py-1.5 font-mono text-sm"
        />
        <button className="px-4 py-1.5 rounded-lg bg-crimson-600 hover:bg-crimson-500 text-white text-sm font-medium transition">
          Check
        </button>
      </form>
      {checked && !value.trim() && <p className="text-sm text-steel-400">Enter an answer first.</p>}
      {checked && value.trim() && (
        <div className={`text-sm ${correct ? 'text-gold-300' : 'text-red-300'}`}>
          {correct ? <Markdown inline>{`Correct. ${block.explain}`}</Markdown> : 'Not quite. Try again.'}
        </div>
      )}
    </>
  );
};
