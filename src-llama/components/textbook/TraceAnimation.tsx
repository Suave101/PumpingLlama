'use client';

import React, { useState } from 'react';
import type { TraceBlock } from '@/lib/textbook/types';

type TraceProps = { block: TraceBlock; watched: boolean; onWatched: () => void };

// Step a DFA through its input one symbol at a time. Watching to the end earns participation credit.
export const TraceAnimation: React.FC<TraceProps> = ({ block, watched, onWatched }) => {
  const { dfa, input } = block;
  const [step, setStep] = useState(0);

  // path[i] is the state after reading i symbols
  const path = [dfa.initialState];
  for (const symbol of input) path.push(dfa.transitions[path[path.length - 1]]?.[symbol] ?? '');
  const current = path[step];
  const finished = step === input.length;
  const accepted = finished && dfa.acceptStates.includes(current);

  const goTo = (next: number) => {
    const clamped = Math.max(0, Math.min(input.length, next));
    setStep(clamped);
    if (clamped === input.length && !watched) onWatched();
  };

  const width = 60 + dfa.states.length * 100;

  return (
    <>
      <p className="text-sm text-steel-300">{block.caption}</p>

      <svg viewBox={`0 0 ${width} 80`} className="w-full max-w-xl h-auto" role="img" aria-label={`Current state ${current}`}>
        {dfa.states.map((state, i) => {
          const cx = 70 + i * 100;
          const active = state === current;
          const accepting = dfa.acceptStates.includes(state);
          return (
            <g key={state}>
              {state === dfa.initialState && <path d={`M ${cx - 52} 40 L ${cx - 30} 40`} stroke="#4fe3ea" strokeWidth="2" />}
              {accepting && <circle cx={cx} cy={40} r={30} fill="none" stroke={active ? '#f0b72f' : '#535962'} strokeWidth="2" />}
              <circle
                cx={cx}
                cy={40}
                r={24}
                fill={active ? '#4a3210' : '#1a1c21'}
                stroke={active ? '#f0b72f' : '#535962'}
                strokeWidth="2"
              />
              <text x={cx} y={45} textAnchor="middle" fontSize="13" fontFamily="monospace" fill={active ? '#fff' : '#aeb3ba'}>
                {state}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Input tape with the read head under the next symbol */}
      <div className="flex flex-wrap gap-1 font-mono" aria-label="Input tape">
        {input.split('').map((symbol, i) => (
          <span
            key={i}
            className={`w-8 h-8 flex items-center justify-center rounded border text-sm ${
              i < step
                ? 'border-steel-800 text-steel-500'
                : i === step
                  ? 'border-arc-500 text-arc-200 bg-arc-950'
                  : 'border-steel-700 text-steel-200'
            }`}
          >
            {symbol}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => goTo(step - 1)}
          disabled={step === 0}
          className="px-3 py-1.5 rounded-lg border border-steel-700 text-sm text-steel-300 hover:text-white disabled:opacity-40"
        >
          Back
        </button>
        <button
          onClick={() => goTo(step + 1)}
          disabled={finished}
          className="px-3 py-1.5 rounded-lg bg-crimson-600 hover:bg-crimson-500 text-white text-sm font-medium disabled:opacity-40"
        >
          Step
        </button>
        <button onClick={() => goTo(input.length)} className="px-3 py-1.5 rounded-lg border border-steel-700 text-sm text-steel-300 hover:text-white">
          Run to end
        </button>
        <button onClick={() => setStep(0)} className="px-3 py-1.5 rounded-lg border border-steel-700 text-sm text-steel-300 hover:text-white">
          Reset
        </button>
        <span className="text-sm text-steel-400 font-mono ml-auto">
          {finished ? (
            <span className={accepted ? 'text-gold-300' : 'text-red-300'}>
              δ*({dfa.initialState}, {input}) = {current}: {accepted ? 'accept' : 'reject'}
            </span>
          ) : step === 0 ? (
            `start in ${current}`
          ) : (
            `read ${input[step - 1]}: ${path[step - 1]} → ${current}`
          )}
        </span>
      </div>
    </>
  );
};
