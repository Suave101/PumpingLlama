import type { DFA, NFA } from '@/types/automata';

// Reading material, written in Markdown with KaTeX math ($...$ and $$...$$)
export type TextBlock = { type: 'text'; md: string };

// Callout box for definitions, theorems, notes and a chapter's key ideas.
// Titled definitions and theorems are collected into the glossary (/book/glossary).
export type CalloutBlock = {
  type: 'callout';
  kind: 'definition' | 'theorem' | 'note' | 'summary';
  title?: string;
  md: string;
};

// Check-your-understanding question: pick one answer
export type ChoiceBlock = {
  type: 'choice';
  id: string;
  prompt: string;
  choices: { text: string; correct?: boolean; explain: string }[];
  points?: number;
};

// Check-your-understanding question: decide for each string whether it is in the language
export type MembershipBlock = {
  type: 'membership';
  id: string;
  prompt: string;
  strings: { w: string; inL: boolean }[];
  points?: number;
};

// Check-your-understanding question: type a short answer; any listed answer is accepted
export type ShortAnswerBlock = {
  type: 'short';
  id: string;
  prompt: string;
  answers: string[];
  explain: string;
  points?: number;
};

// Animation: step a DFA through an input string one symbol at a time
export type TraceBlock = {
  type: 'trace';
  id: string;
  caption: string;
  dfa: DFA;
  input: string;
  points?: number;
};

// Animation: run an NFA, showing the set of states it could be in after each symbol
export type NfaTraceBlock = {
  type: 'nfa-trace';
  id: string;
  caption: string;
  nfa: NFA;
  input: string;
  points?: number;
};

// Single-tape Turing machine. Missing transitions reject; the tape is infinite to the right.
export type TuringMachine = {
  start: string;
  accept: string;
  reject: string;
  blank: string;
  // transitions[state][read] = [next state, symbol to write, head move]
  transitions: Record<string, Record<string, [string, string, 'L' | 'R']>>;
};

// Animation: step a Turing machine, showing the tape, head and state
export type TmTraceBlock = {
  type: 'tm-trace';
  id: string;
  caption: string;
  machine: TuringMachine;
  input: string;
  points?: number;
};

// Fill in the missing cells of a DFA's transition table. Any filling that accepts the same
// language as `dfa` is correct.
export type TableBlock = {
  type: 'table';
  id: string;
  prompt: string;
  dfa: DFA;
  // Cells the student fills in, as [state, symbol]
  blanks: [string, string][];
  points?: number;
};

// Context-free grammar for derivation activities. Variables are single uppercase letters;
// '' is the empty string.
export type SimpleGrammar = { start: string; rules: Record<string, string[]> };

// Build a leftmost derivation of `target` by choosing which rule to apply at each step
export type DerivationBlock = {
  type: 'derivation';
  id: string;
  prompt: string;
  grammar: SimpleGrammar;
  target: string;
  points?: number;
};

// Lab: one of the graded problems from public/problems, solved in the full workspace
export type LabBlock = { type: 'lab'; id: string; problem: string; points?: number };

// Ungraded sandbox: write a Turing machine as text and run it on any input.
// `preset` picks the starting machine from TM_PRESETS (lib/textbook/tm-text.ts).
export type TmPlaygroundBlock = { type: 'tm-playground'; preset?: string };

export type AnimationBlock = TraceBlock | NfaTraceBlock | TmTraceBlock;
export type ActivityBlock =
  | ChoiceBlock
  | MembershipBlock
  | ShortAnswerBlock
  | TableBlock
  | DerivationBlock
  | AnimationBlock
  | LabBlock;
export type Block = TextBlock | CalloutBlock | TmPlaygroundBlock | ActivityBlock;

export type Section = { id: string; title: string; blocks: Block[] };
export type Chapter = {
  id: string;
  title: string;
  summary: string;
  // Markdown recap shown at the end of the chapter's last reading section (before its exercises)
  keyIdeas?: string;
  sections: Section[];
};
export type Book = { title: string; chapters: Chapter[] };

// Saved answer for each activity, keyed by activity id
export type Responses = Record<string, unknown>;
