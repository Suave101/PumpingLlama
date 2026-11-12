'use client';

import React, { useMemo, useState } from 'react';
import type { NfaTraceBlock, TmTraceBlock, TraceBlock } from '@/lib/textbook/types';
import { dfaFrames, nfaFrames, tmFrames } from '@/lib/textbook/simulate';

// Step-through animations for DFAs, NFAs and Turing machines.
// Reaching the last frame earns participation credit.

type Watch = { watched: boolean; onWatched: () => void };

// Frame position plus the Back / Step / Run to end / Reset buttons shared by every animation
function useFrames(count: number, { watched, onWatched }: Watch) {
  const [step, setStep] = useState(0);
  const last = count - 1;
  const goTo = (next: number) => {
    const clamped = Math.max(0, Math.min(last, next));
    setStep(clamped);
    if (clamped === last && !watched) onWatched();
  };
  // Focus the animation, then ← / → step through it and Home / End jump to either end
  const keys = {
    tabIndex: 0,
    'aria-keyshortcuts': 'ArrowLeft ArrowRight Home End',
    className: 'flex flex-col gap-4 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-arc-500/60',
    onKeyDown: (e: React.KeyboardEvent) => {
      const target = { ArrowRight: step + 1, ArrowLeft: step - 1, Home: 0, End: last }[e.key];
      if (target === undefined) return;
      e.preventDefault();
      goTo(target);
    },
  };
  return { step, last, goTo, keys };
}

const buttonClass = 'px-3 py-1.5 rounded-lg border border-steel-700 text-sm text-steel-300 hover:text-white disabled:opacity-40';

const Controls: React.FC<{ step: number; last: number; goTo: (n: number) => void; status: React.ReactNode }> = ({
  step,
  last,
  goTo,
  status,
}) => (
  <div className="flex flex-wrap items-center gap-2">
    <button onClick={() => goTo(step - 1)} disabled={step === 0} className={buttonClass}>
      Back
    </button>
    <button
      onClick={() => goTo(step + 1)}
      disabled={step === last}
      className="px-3 py-1.5 rounded-lg bg-crimson-600 hover:bg-crimson-500 text-white text-sm font-medium disabled:opacity-40"
    >
      Step
    </button>
    <button onClick={() => goTo(last)} className={buttonClass}>
      Run to end
    </button>
    <button onClick={() => goTo(0)} className={buttonClass}>
      Reset
    </button>
    <span className="text-sm text-steel-400 font-mono ml-auto" aria-live="polite">
      {status}
    </span>
  </div>
);

// States drawn in a row; active ones are gold, accepting ones get a double ring
const StateRow: React.FC<{ states: string[]; initial: string; accepting: string[]; active: string[] }> = ({
  states,
  initial,
  accepting,
  active,
}) => (
  <svg
    viewBox={`0 0 ${60 + states.length * 100} 80`}
    className="w-full max-w-xl h-auto"
    role="img"
    aria-label={active.length ? `Active: ${active.join(', ')}` : 'No active states'}
  >
    {states.map((state, i) => {
      const cx = 70 + i * 100;
      const on = active.includes(state);
      // Palette variables (not hex) so the diagram follows the paper / night reading mode
      const ring = { stroke: on ? 'var(--color-gold-400)' : 'var(--color-steel-600)' };
      return (
        <g key={state}>
          {state === initial && (
            <path d={`M ${cx - 52} 40 L ${cx - 30} 40`} style={{ stroke: 'var(--color-arc-400)' }} strokeWidth="2" />
          )}
          {accepting.includes(state) && <circle cx={cx} cy={40} r={30} fill="none" style={ring} strokeWidth="2" />}
          <circle
            cx={cx}
            cy={40}
            r={24}
            style={{ ...ring, fill: on ? 'var(--color-gold-900)' : 'var(--color-steel-900)' }}
            strokeWidth="2"
          />
          <text
            x={cx}
            y={45}
            textAnchor="middle"
            fontSize="13"
            fontFamily="monospace"
            style={{ fill: on ? 'var(--color-white)' : 'var(--color-steel-300)' }}
          >
            {state}
          </text>
        </g>
      );
    })}
  </svg>
);

// Input with the symbols already read dimmed and the next one highlighted
const InputTape: React.FC<{ input: string; position: number }> = ({ input, position }) => (
  <div className="flex flex-wrap gap-1 font-mono" aria-label="Input">
    {input.split('').map((symbol, i) => (
      <span
        key={i}
        className={`w-8 h-8 flex items-center justify-center rounded border text-sm ${
          i < position
            ? 'border-steel-800 text-steel-500'
            : i === position
              ? 'border-arc-500 text-arc-200 bg-arc-950'
              : 'border-steel-700 text-steel-200'
        }`}
      >
        {symbol}
      </span>
    ))}
  </div>
);

const verdict = (accepted: boolean, text: string) => (
  <span className={accepted ? 'text-gold-300' : 'text-red-300'}>{text}</span>
);

export const DfaTrace: React.FC<{ block: TraceBlock } & Watch> = ({ block, ...watch }) => {
  const { dfa, input } = block;
  const frames = useMemo(() => dfaFrames(dfa, input), [dfa, input]);
  const { step, last, goTo, keys } = useFrames(frames.length, watch);
  const current = frames[step];
  const accepted = dfa.acceptStates.includes(current);

  return (
    <div {...keys}>
      <p className="text-sm text-steel-300">{block.caption}</p>
      <StateRow states={dfa.states} initial={dfa.initialState} accepting={dfa.acceptStates} active={[current]} />
      <InputTape input={input} position={step} />
      <Controls
        step={step}
        last={last}
        goTo={goTo}
        status={
          step === last
            ? verdict(accepted, `δ*(${dfa.initialState}, ${input}) = ${current}: ${accepted ? 'accept' : 'reject'}`)
            : step === 0
              ? `start in ${current}`
              : `read ${input[step - 1]}: ${frames[step - 1]} → ${current}`
        }
      />
    </div>
  );
};

const setLabel = (states: string[]) => `{${states.join(', ')}}`;

export const NfaTrace: React.FC<{ block: NfaTraceBlock } & Watch> = ({ block, ...watch }) => {
  const { nfa, input } = block;
  const frames = useMemo(() => nfaFrames(nfa, input), [nfa, input]);
  const { step, last, goTo, keys } = useFrames(frames.length, watch);
  const active = frames[step];
  const accepted = active.some((s) => nfa.acceptStates.includes(s));

  return (
    <div {...keys}>
      <p className="text-sm text-steel-300">{block.caption}</p>
      <StateRow states={nfa.states} initial={nfa.initialState} accepting={nfa.acceptStates} active={active} />
      <InputTape input={input} position={step} />
      <p className="text-sm font-mono text-steel-300">
        Possible states: <span className="text-gold-300">{active.length ? setLabel(active) : '∅ (every run is stuck)'}</span>
      </p>
      <Controls
        step={step}
        last={last}
        goTo={goTo}
        status={
          step === last
            ? verdict(accepted, accepted ? 'some run accepts: accept' : 'no run accepts: reject')
            : step === 0
              ? 'start: ε-closure of the start state'
              : `read ${input[step - 1]}: ${setLabel(frames[step - 1])} → ${setLabel(active)}`
        }
      />
    </div>
  );
};

export const TmTrace: React.FC<{ block: TmTraceBlock } & Watch> = ({ block, ...watch }) => {
  const { machine, input } = block;
  const run = useMemo(() => tmFrames(machine, input), [machine, input]);
  const { step, last, goTo, keys } = useFrames(run.frames.length, watch);
  const frame = run.frames[step];
  // Show a fixed-width window of the tape so the row doesn't jump around as the tape grows
  const width = Math.max(...run.frames.map((f) => f.tape.length)) + 1;
  const cells = Array.from({ length: width }, (_, i) => frame.tape[i] ?? machine.blank);

  return (
    <div {...keys}>
      <p className="text-sm text-steel-300">{block.caption}</p>
      <div className="flex flex-col gap-1 overflow-x-auto pb-1" aria-label={`Tape, head at cell ${frame.head}`}>
        <div className="flex gap-1 font-mono">
          {cells.map((symbol, i) => (
            <span
              key={i}
              className={`shrink-0 w-8 h-8 flex items-center justify-center rounded border text-sm ${
                i === frame.head ? 'border-gold-400 bg-gold-950/60 text-white' : 'border-steel-700 text-steel-300'
              }`}
            >
              {symbol}
            </span>
          ))}
        </div>
        <div className="flex gap-1" aria-hidden="true">
          {cells.map((_, i) => (
            <span key={i} className="shrink-0 w-8 text-center text-gold-400 text-xs">
              {i === frame.head ? '▲' : ''}
            </span>
          ))}
        </div>
      </div>
      <p className="text-sm font-mono text-steel-300">
        state <span className="text-gold-300">{frame.state}</span> · step {step}
        {frame.rule && <span className="text-steel-500"> · {frame.rule}</span>}
      </p>
      <Controls
        step={step}
        last={last}
        goTo={goTo}
        status={
          step === last
            ? run.outcome === 'running'
              ? verdict(false, `still running after ${last} steps`)
              : verdict(run.outcome === 'accept', run.outcome)
            : step === 0
              ? `start in ${machine.start}`
              : `${last - step} steps left`
        }
      />
    </div>
  );
};
