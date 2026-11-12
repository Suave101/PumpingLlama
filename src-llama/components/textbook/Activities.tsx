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

// Every embedded activity sits in a bordered box with a caption underneath,
// e.g. "Activity 3.1.2 · Multiple choice · 1 pt", so it can be referred to by number
export const ActivityCard: React.FC<ActivityCardProps> = ({ label, kind, done, points, children }) => (
  <figure className="flex flex-col gap-2">
    <div
      className={`rounded-xl border-2 bg-steel-900/70 p-5 flex flex-col gap-4 ${
        done ? 'border-gold-600/70' : 'border-steel-700'
      }`}
    >
      {children}
    </div>
    <figcaption className="text-center text-xs text-steel-500">
      Activity <span className="font-mono text-steel-400">{label}</span> · {kind} ·{' '}
      <span className={done ? 'text-gold-400' : ''}>
        {done ? '✓ ' : ''}
        {points} {points === 1 ? 'pt' : 'pts'}
      </span>
    </figcaption>
  </figure>
);

// onRespond saves an attempt; the reader keeps whichever attempt earns the most credit
type ActivityProps<B, R> = { block: B; response: R | undefined; onRespond: (value: R) => void };

const checkButtonClass =
  'px-4 py-1.5 rounded-lg bg-crimson-600 hover:bg-crimson-500 text-white text-sm font-medium transition disabled:opacity-40';

const LETTERS = 'ABCDEFGH';

export const ChoiceActivity: React.FC<ActivityProps<ChoiceBlock, number>> = ({ block, response, onRespond }) => {
  // Pick an option, then press Check; a saved answer starts out checked
  const [picked, setPicked] = useState<number | null>(response ?? null);
  const [checked, setChecked] = useState(response !== undefined);
  const pickedChoice = checked && picked !== null ? block.choices[picked] : null;

  return (
    <>
      <Markdown inline>{block.prompt}</Markdown>
      <fieldset className="flex flex-col gap-1.5">
        <legend className="text-xs text-steel-500 mb-1.5">Choose one</legend>
        {block.choices.map((choice, i) => {
          const selected = picked === i;
          const tone =
            selected && checked
              ? choice.correct
                ? 'border-gold-500 bg-gold-950/40'
                : 'border-red-500/70 bg-red-950/30'
              : selected
                ? 'border-arc-500 bg-arc-950/40'
                : 'border-transparent hover:border-steel-700';
          return (
            <label key={i} className={`flex items-start gap-3 px-3 py-2 rounded-lg border cursor-pointer transition ${tone}`}>
              <input
                type="radio"
                name={block.id}
                checked={selected}
                onChange={() => {
                  setPicked(i);
                  setChecked(false);
                }}
                className="mt-1.5 accent-crimson-600"
              />
              <span className="font-mono text-sm text-steel-400 mt-0.5">{LETTERS[i]}.</span>
              <Markdown inline>{choice.text}</Markdown>
            </label>
          );
        })}
      </fieldset>
      <div>
        <button
          disabled={picked === null}
          onClick={() => {
            if (picked === null) return;
            setChecked(true);
            onRespond(picked);
          }}
          className={checkButtonClass}
        >
          Check
        </button>
      </div>
      {pickedChoice && (
        <div className={`text-sm ${pickedChoice.correct ? 'text-gold-300' : 'text-red-300'}`}>
          {/* Explanations for correct choices already open with "Right." */}
          <Markdown inline>
            {pickedChoice.correct
              ? `${LETTERS[picked!]}. ${pickedChoice.explain}`
              : `${LETTERS[picked!]}. Not quite. ${pickedChoice.explain}`}
          </Markdown>
        </div>
      )}
    </>
  );
};

const display = (w: string) => (w === '' ? 'ε' : w);

// After this many wrong checks a "Show answer" button appears. Seeing the answer doesn't give
// credit; the student still has to enter it.
const ATTEMPTS_BEFORE_REVEAL = 2;

const ShowAnswerButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="px-3 py-1.5 rounded-lg border border-steel-700 text-sm text-steel-300 hover:text-white transition"
  >
    Show answer
  </button>
);

export const MembershipActivity: React.FC<ActivityProps<MembershipBlock, boolean[]>> = ({ block, response, onRespond }) => {
  const [answers, setAnswers] = useState<(boolean | null)[]>(() => response ?? block.strings.map(() => null));
  const [checked, setChecked] = useState(Boolean(response));
  const [wrongChecks, setWrongChecks] = useState(0);
  const [revealed, setRevealed] = useState(false);
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
              {revealed && (
                <span className="text-xs text-gold-300 mr-auto ml-2">{s.inL ? 'answer: in L' : 'answer: not in L'}</span>
              )}
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
            if (!allAnswered) return;
            if (!allCorrect) setWrongChecks((n) => n + 1);
            onRespond(answers as boolean[]);
          }}
          className="px-4 py-1.5 rounded-lg bg-crimson-600 hover:bg-crimson-500 text-white text-sm font-medium transition"
        >
          Check
        </button>
        {wrongChecks >= ATTEMPTS_BEFORE_REVEAL && !revealed && !allCorrect && (
          <ShowAnswerButton onClick={() => setRevealed(true)} />
        )}
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
  const [wrongChecks, setWrongChecks] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const correct = block.answers.some((a) => normalize(a) === normalize(value));

  return (
    <>
      <Markdown inline>{block.prompt}</Markdown>
      <form
        className="flex flex-wrap items-center gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          setChecked(true);
          if (!value.trim()) return;
          if (!correct) setWrongChecks((n) => n + 1);
          onRespond(value);
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
      {wrongChecks >= ATTEMPTS_BEFORE_REVEAL && !correct && !revealed && (
        <div>
          <ShowAnswerButton onClick={() => setRevealed(true)} />
        </div>
      )}
      {revealed && !correct && (
        <div className="text-sm text-steel-300 border-l-2 border-gold-500 pl-3">
          <Markdown inline>{`Answer: \`${block.answers[0]}\`. ${block.explain} Type it in to get credit.`}</Markdown>
        </div>
      )}
    </>
  );
};
