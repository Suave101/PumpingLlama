'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { TmPlaygroundBlock, TuringMachine } from '@/lib/textbook/types';
import { tmFrames, type TmRun } from '@/lib/textbook/simulate';
import { parseTuringMachine, TM_PRESETS, type TmRule } from '@/lib/textbook/tm-text';

// Write a Turing machine as text, then run it on any input with step / play controls.
// Ungraded: it is a sandbox for experimenting, not an activity.

const MAX_STEPS = 2000;
const WINDOW = 31; // tape cells shown at once
const SPEEDS = { Slow: 600, Normal: 250, Fast: 60 } as const;
type Speed = keyof typeof SPEEDS;

type Session = { text: string; input: string; machine: TuringMachine; rules: TmRule[]; run: TmRun };

const buttonClass =
  'px-3 py-1.5 rounded-lg border border-steel-700 text-sm text-steel-300 hover:text-white disabled:opacity-40';
const primaryClass =
  'px-4 py-1.5 rounded-lg bg-crimson-600 hover:bg-crimson-500 text-white text-sm font-medium disabled:opacity-40';

export const TmPlayground: React.FC<{ block: TmPlaygroundBlock }> = ({ block }) => {
  const initial = TM_PRESETS.find((p) => p.id === block.preset) ?? TM_PRESETS[0];
  const [presetId, setPresetId] = useState(initial.id);
  const [text, setText] = useState(initial.text);
  const [input, setInput] = useState(initial.input);
  const [session, setSession] = useState<Session | null>(null);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>('Normal');

  const parsed = useMemo(() => parseTuringMachine(text), [text]);
  const blankInInput = parsed.machine && input.includes(parsed.machine.blank);

  const last = session ? session.run.frames.length - 1 : 0;

  // Autoplay advances one step per tick and stops itself at the last frame
  useEffect(() => {
    if (!playing || !session) return;
    const timer = setInterval(() => {
      setStep((s) => {
        if (s + 1 >= last) setPlaying(false);
        return Math.min(s + 1, last);
      });
    }, SPEEDS[speed]);
    return () => clearInterval(timer);
  }, [playing, session, speed, last]);

  const start = () => {
    if (!parsed.machine) return;
    const run = tmFrames(parsed.machine, input, MAX_STEPS);
    setSession({ text, input, machine: parsed.machine, rules: parsed.rules, run });
    setStep(0);
    setPlaying(false);
  };

  const loadPreset = (id: string) => {
    const preset = TM_PRESETS.find((p) => p.id === id);
    if (!preset) return;
    setPresetId(id);
    setText(preset.text);
    setInput(preset.input);
    setSession(null);
    setPlaying(false);
  };

  const goTo = (n: number) => {
    setPlaying(false);
    setStep(Math.max(0, Math.min(last, n)));
  };

  const stale = session && (session.text !== text || session.input !== input);

  return (
    <figure className="flex flex-col gap-2">
      <div className="rounded-xl border-2 border-arc-700/70 bg-steel-900/70 p-5 flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm text-steel-300" htmlFor="tm-preset">
            Start from
          </label>
          <select
            id="tm-preset"
            value={presetId}
            onChange={(e) => loadPreset(e.target.value)}
            className="rounded-lg border border-steel-700 bg-steel-950 px-2 py-1.5 text-sm text-steel-100"
          >
            {TM_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <span className="text-xs text-steel-400">{TM_PRESETS.find((p) => p.id === presetId)?.description}</span>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-steel-400" htmlFor="tm-rules">
            Machine
          </label>
          <textarea
            id="tm-rules"
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
            rows={Math.min(18, Math.max(6, text.split('\n').length + 1))}
            className="w-full rounded-lg border border-steel-700 bg-steel-950 p-3 font-mono text-sm text-steel-100 leading-relaxed outline-none focus:border-arc-500"
          />
          <p className="text-xs text-steel-500">
            One rule per line: <code className="font-mono text-steel-300">state, read -&gt; next, write, L|R</code>. Use{' '}
            <code className="font-mono text-steel-300">_</code> for blank (or set <code className="font-mono">blank:</code>),{' '}
            <code className="font-mono">#</code> for comments. Halting states are{' '}
            <code className="font-mono">accept</code> and <code className="font-mono">reject</code>; a missing rule rejects.
            Moving left from the first cell stays put.
          </p>
          {parsed.errors.length > 0 && (
            <ul className="text-sm text-red-300 flex flex-col gap-0.5" aria-live="polite">
              {parsed.errors.map((e, i) => (
                <li key={i}>
                  {e.line > 0 && <span className="font-mono text-red-400">Line {e.line}: </span>}
                  {e.message}
                </li>
              ))}
            </ul>
          )}
        </div>

        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            start();
          }}
        >
          <div className="flex flex-col gap-1 grow">
            <label className="text-xs font-semibold uppercase tracking-wider text-steel-400" htmlFor="tm-input">
              Input string
            </label>
            <input
              id="tm-input"
              value={input}
              onChange={(e) => setInput(e.target.value.replace(/\s/g, ''))}
              placeholder="empty string"
              spellCheck={false}
              className="rounded-lg border border-steel-700 bg-steel-950 px-3 py-1.5 font-mono text-sm text-steel-100 outline-none focus:border-arc-500"
            />
          </div>
          <button type="submit" disabled={!parsed.machine} className={primaryClass}>
            {session ? 'Restart' : 'Run'}
          </button>
        </form>
        {blankInInput && (
          <p className="text-sm text-gold-300 -mt-3">
            The input contains the blank symbol, so the machine can&apos;t tell it apart from empty tape.
          </p>
        )}

        {session && (
          <RunView
            session={session}
            step={step}
            last={last}
            goTo={goTo}
            playing={playing}
            setPlaying={setPlaying}
            speed={speed}
            setSpeed={setSpeed}
            stale={Boolean(stale)}
          />
        )}
      </div>
      <figcaption className="text-center text-xs text-steel-500">Turing machine simulator · not graded</figcaption>
    </figure>
  );
};

type RunViewProps = {
  session: Session;
  step: number;
  last: number;
  goTo: (n: number) => void;
  playing: boolean;
  setPlaying: (p: boolean) => void;
  speed: Speed;
  setSpeed: (s: Speed) => void;
  stale: boolean;
};

const RunView: React.FC<RunViewProps> = ({ session, step, last, goTo, playing, setPlaying, speed, setSpeed, stale }) => {
  const { machine, run, rules } = session;
  const frame = run.frames[step];
  const read = frame.tape[frame.head] ?? machine.blank;
  const halted = frame.state === machine.accept || frame.state === machine.reject;
  // The rule that fires next, highlighted in the rule list
  const nextRule = halted ? undefined : rules.find((r) => r.state === frame.state && r.read === read);

  // Show a window of the tape that follows the head
  const width = Math.max(frame.tape.length + 1, WINDOW);
  const first = Math.max(0, Math.min(frame.head - Math.floor(WINDOW / 2), width - WINDOW));
  const cells = Array.from({ length: WINDOW }, (_, i) => first + i);

  // Keep the head centred when the tape is wider than the screen (cells are 28px plus a 4px gap)
  const tapeRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = tapeRef.current;
    if (el) el.scrollLeft = (frame.head - first) * 32 + 14 - el.clientWidth / 2;
  }, [frame.head, first]);

  // What is left on the tape, without trailing blanks: the machine's output
  const output = frame.tape.join('').replace(new RegExp(`[${escapeClass(machine.blank)}]+$`), '');

  const status =
    step === last
      ? run.outcome === 'running'
        ? `No answer after ${last.toLocaleString()} steps. It may run forever, and no simulator can always tell (see Chapter 7).`
        : run.outcome === 'accept'
          ? `Accepted after ${last} steps.`
          : `Rejected after ${last} steps.`
      : step === 0
        ? `Start in ${machine.start} with the head on the first cell.`
        : `Step ${step} of ${last}${run.outcome === 'running' ? '+' : ''}.`;

  return (
    <div
      className="flex flex-col gap-4 border-t border-steel-800 pt-4 outline-none"
      tabIndex={0}
      aria-keyshortcuts="ArrowLeft ArrowRight Home End"
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        const target = { ArrowRight: step + 1, ArrowLeft: step - 1, Home: 0, End: last }[e.key];
        if (target === undefined) return;
        e.preventDefault();
        goTo(target);
      }}
    >
      {stale && (
        <p className="text-sm text-gold-300">You changed the machine or input. Press Restart to run the new version.</p>
      )}

      <div
        ref={tapeRef}
        className="flex flex-col gap-1 overflow-x-auto pb-1"
        aria-label={`Tape, head at cell ${frame.head + 1}`}
      >
        <div className="flex gap-1 font-mono">
          {cells.map((i) => (
            <span
              key={i}
              className={`shrink-0 w-7 h-8 flex items-center justify-center rounded border text-sm ${
                i === frame.head
                  ? 'border-gold-400 bg-gold-950/60 text-white'
                  : i < frame.tape.length
                    ? 'border-steel-700 text-steel-200'
                    : 'border-steel-800 text-steel-600'
              }`}
            >
              {frame.tape[i] ?? machine.blank}
            </span>
          ))}
        </div>
        <div className="flex gap-1" aria-hidden="true">
          {cells.map((i) => (
            <span key={i} className="shrink-0 w-7 text-center text-gold-400 text-xs">
              {i === frame.head ? '▲' : ''}
            </span>
          ))}
        </div>
      </div>
      {first > 0 && <p className="text-xs text-steel-500 -mt-3">Showing cells {first + 1}–{first + WINDOW}.</p>}

      <div className="grid gap-x-6 gap-y-1 text-sm font-mono text-steel-300 sm:grid-cols-2">
        <p>
          state{' '}
          <span
            className={
              frame.state === machine.accept ? 'text-gold-300' : frame.state === machine.reject ? 'text-red-300' : 'text-arc-300'
            }
          >
            {frame.state}
          </span>{' '}
          · reading <span className="text-white">{read}</span>
        </p>
        <p>
          tape <span className="text-white">{output || 'ε'}</span>
        </p>
        {frame.rule && <p className="sm:col-span-2 text-steel-500">last rule: {frame.rule}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => goTo(step - 1)} disabled={step === 0} className={buttonClass}>
          Back
        </button>
        <button onClick={() => goTo(step + 1)} disabled={step === last} className={primaryClass}>
          Step
        </button>
        <button
          onClick={() => (playing ? setPlaying(false) : step < last && setPlaying(true))}
          disabled={step === last && !playing}
          className={buttonClass}
        >
          {playing ? 'Pause' : 'Play'}
        </button>
        <button onClick={() => goTo(last)} className={buttonClass}>
          Run to end
        </button>
        <button onClick={() => goTo(0)} className={buttonClass}>
          Reset
        </button>
        <select
          aria-label="Playback speed"
          value={speed}
          onChange={(e) => setSpeed(e.target.value as Speed)}
          className="rounded-lg border border-steel-700 bg-steel-950 px-2 py-1.5 text-sm text-steel-300"
        >
          {Object.keys(SPEEDS).map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      <p
        className={`text-sm ${
          step === last ? (run.outcome === 'accept' ? 'text-gold-300' : 'text-red-300') : 'text-steel-400'
        }`}
        aria-live="polite"
      >
        {status}
      </p>

      <details className="text-sm">
        <summary className="cursor-pointer text-steel-400 hover:text-white">Rules ({rules.length})</summary>
        <ul className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-steel-800 font-mono text-xs">
          {rules.map((r) => (
            <li
              key={r.line}
              className={`px-3 py-1 ${r === nextRule ? 'bg-gold-950/60 text-white' : 'text-steel-400'}`}
            >
              {r.state}, {r.read} → {r.next}, {r.write}, {r.move}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
};

const escapeClass = (s: string) => s.replace(/[\\\]^-]/g, '\\$&');
