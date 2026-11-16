import type { TuringMachine } from './types';

// Plain-text format for the Turing machine playground:
//
//   # comments start with #
//   start: q0          (optional; defaults to the state of the first rule)
//   accept: accept     (optional; this is the default)
//   reject: reject     (optional; this is the default)
//   blank: _           (optional; this is the default)
//   q0, 0 -> q1, X, R  (in state q0 reading 0: go to q1, write X, move right)
//
// Tape symbols are single characters. A missing rule rejects.

export type TmParseError = { line: number; message: string };
export type TmRule = { line: number; state: string; read: string; next: string; write: string; move: 'L' | 'R' };
export type TmParseResult = { machine: TuringMachine | null; rules: TmRule[]; errors: TmParseError[] };

const SETTINGS = ['start', 'accept', 'reject', 'blank'] as const;
type Setting = (typeof SETTINGS)[number];

const RULE = /^([^,\s]+)\s*,\s*(\S+)\s*->\s*([^,\s]+)\s*,\s*(\S+)\s*,\s*(\S+)$/;

export function parseTuringMachine(text: string): TmParseResult {
  const settings: Partial<Record<Setting, string>> = {};
  const rules: TmRule[] = [];
  const errors: TmParseError[] = [];

  text.split(/\r?\n/).forEach((raw, i) => {
    const line = i + 1;
    const content = raw.replace(/#.*/, '').trim();
    if (!content) return;

    const setting = /^(\w+)\s*:\s*(\S+)$/.exec(content);
    if (setting && !content.includes('->')) {
      const key = setting[1].toLowerCase();
      if ((SETTINGS as readonly string[]).includes(key)) settings[key as Setting] = setting[2];
      else errors.push({ line, message: `Unknown setting "${setting[1]}". Use start, accept, reject or blank.` });
      return;
    }

    const match = RULE.exec(content);
    if (!match) {
      errors.push({ line, message: 'Expected a rule like "q0, 0 -> q1, X, R".' });
      return;
    }
    const [, state, read, next, write, moveRaw] = match;
    const move = moveRaw.toUpperCase();
    if (move !== 'L' && move !== 'R') {
      errors.push({ line, message: `The move must be L or R, not "${moveRaw}".` });
      return;
    }
    for (const symbol of [read, write]) {
      if ([...symbol].length !== 1) {
        errors.push({ line, message: `Tape symbols are single characters, but "${symbol}" has ${[...symbol].length}.` });
        return;
      }
    }
    rules.push({ line, state, read, next, write, move });
  });

  const blank = settings.blank ?? '_';
  if ([...blank].length !== 1) errors.push({ line: 0, message: `The blank must be a single character, not "${blank}".` });
  const accept = settings.accept ?? 'accept';
  const reject = settings.reject ?? 'reject';
  if (accept === reject) errors.push({ line: 0, message: 'The accept and reject states must be different.' });
  const start = settings.start ?? rules[0]?.state;
  if (!start && errors.length === 0) errors.push({ line: 0, message: 'Add at least one rule.' });

  const transitions: TuringMachine['transitions'] = {};
  const seen = new Map<string, number>();
  for (const rule of rules) {
    if (rule.state === accept || rule.state === reject) {
      errors.push({ line: rule.line, message: `"${rule.state}" is a halting state, so it can't have rules.` });
      continue;
    }
    const key = `${rule.state}\u0000${rule.read}`;
    const earlier = seen.get(key);
    if (earlier !== undefined) {
      errors.push({
        line: rule.line,
        message: `Line ${earlier} already says what ${rule.state} does on "${rule.read}". A Turing machine is deterministic.`,
      });
      continue;
    }
    seen.set(key, rule.line);
    (transitions[rule.state] ??= {})[rule.read] = [rule.next, rule.write, rule.move];
  }

  errors.sort((a, b) => a.line - b.line);
  return {
    machine: errors.length || !start ? null : { start, accept, reject, blank, transitions },
    rules,
    errors,
  };
}

export type TmPreset = { id: string; name: string; description: string; input: string; text: string };

export const TM_PRESETS: TmPreset[] = [
  {
    id: 'zero-n-one-n',
    name: '0ⁿ1ⁿ',
    description: 'The machine from Section 6.1: cross off one 0 and one 1 per pass.',
    input: '000111',
    text: `# Accepts 0ⁿ1ⁿ by crossing off one 0 (as X) and one 1 (as Y) per pass
start: q0
q0, 0 -> q1, X, R
q0, Y -> q3, Y, R
q0, _ -> accept, _, R
q1, 0 -> q1, 0, R
q1, Y -> q1, Y, R
q1, 1 -> q2, Y, L
q2, 0 -> q2, 0, L
q2, Y -> q2, Y, L
q2, X -> q0, X, R
q3, Y -> q3, Y, R
q3, _ -> accept, _, R`,
  },
  {
    id: 'palindrome',
    name: 'Palindromes',
    description: 'Erase the first symbol, carry it to the far end in the state, and compare.',
    input: 'abba',
    text: `# Accepts palindromes over {a, b}
# ra / rb remember the erased symbol while running right,
# ca / cb check that the last symbol matches it
start: q0
q0, a -> ra, _, R
q0, b -> rb, _, R
q0, _ -> accept, _, R
ra, a -> ra, a, R
ra, b -> ra, b, R
ra, _ -> ca, _, L
rb, a -> rb, a, R
rb, b -> rb, b, R
rb, _ -> cb, _, L
ca, a -> back, _, L
ca, _ -> accept, _, R
cb, b -> back, _, L
cb, _ -> accept, _, R
back, a -> back, a, L
back, b -> back, b, L
back, _ -> q0, _, R`,
  },
  {
    id: 'increment',
    name: 'Add one',
    description: 'Adds 1 to a binary number written least significant bit first. The answer is left on the tape.',
    input: '1101',
    text: `# Binary increment, least significant bit FIRST (so 1101 means 1 + 4 + 8 = 13)
# Turn leading 1s into 0s until a 0 or blank absorbs the carry
start: carry
carry, 1 -> carry, 0, R
carry, 0 -> accept, 1, R
carry, _ -> accept, 1, R`,
  },
  {
    id: 'forever',
    name: 'Runs forever',
    description: 'Never halts: it walks right forever. Watch the simulator give up.',
    input: '01',
    text: `# Never halts: walks right forever, past the input and through the blanks
start: walk
walk, 0 -> walk, 0, R
walk, 1 -> walk, 1, R
walk, _ -> walk, _, R`,
  },
  {
    id: 'blank',
    name: 'Blank',
    description: 'Start from scratch.',
    input: '',
    text: `# Write one rule per line:  state, read -> next state, write, L or R
# The machine starts in the first rule's state; use _ for a blank cell.
start: q0
q0, _ -> accept, _, R`,
  },
];
