import type { DFA } from '@/types/automata';
import { findDfaCounterexample } from '@/lib/logic';
import type { SimpleGrammar, TableBlock } from './types';

// Checking logic for the table and derivation activities, shared by the reader and the score route

export const cellKey = (state: string, symbol: string) => `${state}|${symbol}`;

// The DFA with the student's choices written into the blank cells
export function fillTable(block: TableBlock, cells: Record<string, string>): DFA {
  const transitions: DFA['transitions'] = {};
  for (const state of block.dfa.states) transitions[state] = { ...block.dfa.transitions[state] };
  for (const [state, symbol] of block.blanks) transitions[state][symbol] = cells[cellKey(state, symbol)] ?? '';
  return { ...block.dfa, transitions };
}

export type TableCheck =
  | { status: 'incomplete' }
  | { status: 'correct' }
  | { status: 'wrong'; counterexample: string; shouldAccept: boolean };

export function checkTable(block: TableBlock, cells: Record<string, string>): TableCheck {
  if (block.blanks.some(([q, a]) => !block.dfa.states.includes(cells[cellKey(q, a)]))) return { status: 'incomplete' };
  const student = fillTable(block, cells);
  const { equivalent, counterexample } = findDfaCounterexample(student, block.dfa);
  if (equivalent || counterexample === null) return { status: 'correct' };
  // Whether the target language contains the counterexample, read off the answer DFA
  let state = block.dfa.initialState;
  for (const symbol of counterexample) state = block.dfa.transitions[state]?.[symbol] ?? '';
  return { status: 'wrong', counterexample, shouldAccept: block.dfa.acceptStates.includes(state) };
}

const isVariable = (grammar: SimpleGrammar, ch: string) => ch in grammar.rules;

export function leftmostVariable(grammar: SimpleGrammar, form: string): number {
  for (let i = 0; i < form.length; i++) if (isVariable(grammar, form[i])) return i;
  return -1;
}

// Replay a list of chosen right-hand sides as a leftmost derivation. Returns every sentential form,
// or null if some step uses a rule the leftmost variable doesn't have.
export function replayDerivation(grammar: SimpleGrammar, steps: string[]): string[] | null {
  const forms = [grammar.start];
  for (const rhs of steps) {
    const form = forms[forms.length - 1];
    const i = leftmostVariable(grammar, form);
    if (i < 0 || !grammar.rules[form[i]].includes(rhs)) return null;
    forms.push(form.slice(0, i) + rhs + form.slice(i + 1));
    if (forms.length > 200) return null;
  }
  return forms;
}

// The terminals before the leftmost variable can never change, so they must start the target
export function canStillReach(grammar: SimpleGrammar, form: string, target: string): boolean {
  const i = leftmostVariable(grammar, form);
  const fixed = i < 0 ? form : form.slice(0, i);
  return i < 0 ? form === target : target.startsWith(fixed);
}

export function derivesTarget(grammar: SimpleGrammar, steps: unknown, target: string): boolean {
  if (!Array.isArray(steps) || !steps.every((s) => typeof s === 'string')) return false;
  const forms = replayDerivation(grammar, steps);
  return forms !== null && forms[forms.length - 1] === target;
}
