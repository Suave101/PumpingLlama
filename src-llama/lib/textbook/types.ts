import type { DFA } from '@/types/automata';

// Reading material, written in Markdown with KaTeX math ($...$ and $$...$$)
export type TextBlock = { type: 'text'; md: string };

// Callout box for definitions, theorems and warnings
export type CalloutBlock = { type: 'callout'; kind: 'definition' | 'theorem' | 'note'; title?: string; md: string };

// Participation activity: pick one answer
export type ChoiceBlock = {
  type: 'choice';
  id: string;
  prompt: string;
  choices: { text: string; correct?: boolean; explain: string }[];
  points?: number;
};

// Participation activity: decide for each string whether it is in the language
export type MembershipBlock = {
  type: 'membership';
  id: string;
  prompt: string;
  strings: { w: string; inL: boolean }[];
  points?: number;
};

// Participation activity: type a short answer; any listed answer is accepted
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

// Lab: one of the graded problems from public/problems, solved in the full workspace
export type LabBlock = { type: 'lab'; id: string; problem: string; points?: number };

export type Block = TextBlock | CalloutBlock | ChoiceBlock | MembershipBlock | ShortAnswerBlock | TraceBlock | LabBlock;
export type ActivityBlock = ChoiceBlock | MembershipBlock | ShortAnswerBlock | TraceBlock | LabBlock;

export type Section = { id: string; title: string; blocks: Block[] };
export type Chapter = { id: string; title: string; summary: string; sections: Section[] };
export type Book = { title: string; chapters: Chapter[] };

// Saved answer for each activity, keyed by activity id
export type Responses = Record<string, unknown>;
