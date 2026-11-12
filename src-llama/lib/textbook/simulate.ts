import type { DFA, NFA } from '@/types/automata';
import type { TuringMachine } from './types';

// Step-by-step runs for the textbook animations. Each returns one frame per step, frame 0 being the start.

// DFA: the state after each prefix of the input ('' once the machine has no transition)
export function dfaFrames(dfa: DFA, input: string): string[] {
  const frames = [dfa.initialState];
  for (const symbol of input) frames.push(dfa.transitions[frames[frames.length - 1]]?.[symbol] ?? '');
  return frames;
}

// States reachable from `states` using only ε-transitions (stored under the '' symbol)
export function epsilonClosure(nfa: NFA, states: string[]): string[] {
  const seen = new Set(states);
  const stack = [...states];
  while (stack.length > 0) {
    for (const next of nfa.transitions[stack.pop()!]?.[''] ?? []) {
      if (!seen.has(next)) {
        seen.add(next);
        stack.push(next);
      }
    }
  }
  return nfa.states.filter((s) => seen.has(s));
}

// NFA: the set of states the machine could be in after each prefix (the subset construction, run on one input)
export function nfaFrames(nfa: NFA, input: string): string[][] {
  const frames = [epsilonClosure(nfa, [nfa.initialState])];
  for (const symbol of input) {
    const moved = frames[frames.length - 1].flatMap((s) => nfa.transitions[s]?.[symbol] ?? []);
    frames.push(epsilonClosure(nfa, moved));
  }
  return frames;
}

export type TmFrame = {
  state: string;
  tape: string[];
  head: number;
  // The rule that produced this frame, as "q, a → r, b, R"
  rule?: string;
};

export type TmRun = { frames: TmFrame[]; outcome: 'accept' | 'reject' | 'running' };

// Turing machine on a tape that is infinite to the right. Moving left off cell 0 stays put.
// Missing transitions go to the reject state; runs stop after `maxSteps` to keep loops finite.
export function tmFrames(tm: TuringMachine, input: string, maxSteps = 500): TmRun {
  let frame: TmFrame = { state: tm.start, tape: input === '' ? [tm.blank] : input.split(''), head: 0 };
  const frames = [frame];

  while (frames.length <= maxSteps) {
    if (frame.state === tm.accept) return { frames, outcome: 'accept' };
    if (frame.state === tm.reject) return { frames, outcome: 'reject' };

    const read = frame.tape[frame.head] ?? tm.blank;
    const rule = tm.transitions[frame.state]?.[read];
    const tape = [...frame.tape];
    if (!rule) {
      frame = { state: tm.reject, tape, head: frame.head, rule: `${frame.state}, ${read} → ${tm.reject} (no rule)` };
    } else {
      const [next, write, move] = rule;
      tape[frame.head] = write;
      const head = Math.max(0, frame.head + (move === 'R' ? 1 : -1));
      while (tape.length <= head) tape.push(tm.blank);
      frame = { state: next, tape, head, rule: `${frame.state}, ${read} → ${next}, ${write}, ${move}` };
    }
    frames.push(frame);
  }
  return { frames, outcome: 'running' };
}
