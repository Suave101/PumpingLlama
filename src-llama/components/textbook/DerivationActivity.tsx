'use client';

import React, { useMemo, useState } from 'react';
import type { DerivationBlock } from '@/lib/textbook/types';
import { canStillReach, leftmostVariable, replayDerivation } from '@/lib/textbook/exercises';
import { Markdown } from './Markdown';

type DerivationProps = { block: DerivationBlock; response: string[] | undefined; onRespond: (steps: string[]) => void };

const show = (s: string) => (s === '' ? 'ε' : s);

// Build a leftmost derivation one rule at a time: the leftmost variable is highlighted and its
// rules are offered as buttons. Reaching the target string saves the derivation for credit.
export const DerivationActivity: React.FC<DerivationProps> = ({ block, response, onRespond }) => {
  const { grammar, target } = block;
  const [steps, setSteps] = useState<string[]>(response ?? []);
  const forms = useMemo(() => replayDerivation(grammar, steps) ?? [grammar.start], [grammar, steps]);
  const form = forms[forms.length - 1];
  const i = leftmostVariable(grammar, form);
  const done = i < 0 && form === target;
  const stuck = !done && !canStillReach(grammar, form, target);

  const apply = (rhs: string) => {
    const next = [...steps, rhs];
    setSteps(next);
    const replayed = replayDerivation(grammar, next);
    if (replayed && replayed[replayed.length - 1] === target) onRespond(next);
  };

  return (
    <>
      <Markdown inline>{block.prompt}</Markdown>

      <div className="text-sm text-steel-400">
        Grammar:{' '}
        {Object.entries(grammar.rules).map(([v, rhs], k) => (
          <span key={v} className="font-mono text-steel-200 mr-4 whitespace-nowrap">
            {k > 0 && <span className="text-steel-600 mr-4">·</span>}
            <span className="text-arc-400">{v}</span> → {rhs.map(show).join(' | ')}
          </span>
        ))}
        <span className="ml-2">
          Target: <code className="font-mono text-gold-300">{show(target)}</code>
        </span>
      </div>

      {/* The derivation so far, with the leftmost variable of the current form highlighted */}
      <ol className="font-mono text-sm flex flex-wrap items-center gap-x-2 gap-y-1" aria-label="Derivation so far">
        {forms.map((f, k) => {
          const isLast = k === forms.length - 1;
          return (
            <li key={k} className="flex items-center gap-2">
              {k > 0 && <span className="text-steel-500">⇒</span>}
              <span className={isLast ? 'text-steel-100' : 'text-steel-400'}>
                {isLast && i >= 0 ? (
                  <>
                    {f.slice(0, i)}
                    <span className="text-arc-300 underline decoration-2 underline-offset-4">{f[i]}</span>
                    {f.slice(i + 1)}
                  </>
                ) : (
                  show(f)
                )}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="flex flex-wrap items-center gap-2">
        {i >= 0 &&
          grammar.rules[form[i]].map((rhs) => (
            <button
              key={rhs}
              onClick={() => apply(rhs)}
              className="px-3 py-1.5 rounded-lg border border-arc-600/60 text-arc-200 hover:bg-arc-950 font-mono text-sm transition"
            >
              {form[i]} → {show(rhs)}
            </button>
          ))}
        <button
          onClick={() => setSteps((s) => s.slice(0, -1))}
          disabled={steps.length === 0}
          className="px-3 py-1.5 rounded-lg border border-steel-700 text-sm text-steel-300 hover:text-white disabled:opacity-40"
        >
          Undo
        </button>
        <button
          onClick={() => setSteps([])}
          disabled={steps.length === 0}
          className="px-3 py-1.5 rounded-lg border border-steel-700 text-sm text-steel-300 hover:text-white disabled:opacity-40"
        >
          Start over
        </button>
      </div>

      {done && (
        <p className="text-sm text-gold-300">
          Derived <code className="font-mono">{show(target)}</code> in {steps.length} steps.
        </p>
      )}
      {stuck && (
        <p className="text-sm text-red-300">
          This form can no longer become <code className="font-mono">{show(target)}</code>: the symbols before the
          leftmost variable never change. Undo a step.
        </p>
      )}
    </>
  );
};
