import type { Chapter } from '../types';
import { md } from '../md';

const ODD_ONES = {
  states: ['q0', 'q1'],
  alphabet: ['0', '1'],
  initialState: 'q0',
  acceptStates: ['q1'],
  transitions: { q0: { '0': 'q0', '1': 'q1' }, q1: { '0': 'q1', '1': 'q0' } },
};

const ENDS_01 = {
  states: ['s', 'saw0', 'saw01'],
  alphabet: ['0', '1'],
  initialState: 's',
  acceptStates: ['saw01'],
  transitions: {
    s: { '0': 'saw0', '1': 's' },
    saw0: { '0': 'saw0', '1': 'saw01' },
    saw01: { '0': 'saw0', '1': 's' },
  },
};

export const finiteStateMachines: Chapter = {
  id: 'finite-state-machines',
  title: 'Finite-state machines',
  summary: 'Deterministic finite automata, how to design them, the product construction, and fooling sets.',
  sections: [
    {
      id: 'dfas',
      title: 'Deterministic finite automata',
      blocks: [
        {
          type: 'text',
          md: md`Imagine reading a string one symbol at a time, left to right, while remembering only a fixed, finite amount of
information. After the last symbol you must answer *accept* or *reject*. A machine that works this way is a
**finite-state machine**, and the information it remembers is its **state**.`,
        },
        {
          type: 'callout',
          kind: 'definition',
          title: 'DFA',
          md: md`A **deterministic finite automaton** is a tuple $M = (\Sigma, Q, s, A, \delta)$ where

- $\Sigma$ is the input alphabet and $Q$ is a finite set of states,
- $s \in Q$ is the start state and $A \subseteq Q$ is the set of accepting states,
- $\delta : Q \times \Sigma \to Q$ is the transition function.`,
        },
        {
          type: 'text',
          md: md`We extend $\delta$ to whole strings recursively, exactly the way strings are built:

$$\delta^*(q, w) = \begin{cases} q & \text{if } w = \varepsilon \\ \delta^*(\delta(q, a), x) & \text{if } w = a \cdot x \end{cases}$$

$M$ **accepts** $w$ when $\delta^*(s, w) \in A$, and the **language of $M$**, $L(M)$, is the set of strings it
accepts. In diagrams, the start state has an incoming arrow and accepting states have a double ring.

Step through the machine below. It tracks only the parity of the \`1\`s seen so far.`,
        },
        {
          type: 'trace',
          id: 'dfa-trace-odd-ones',
          caption: 'A DFA for strings with an odd number of 1s, reading 10110',
          dfa: ODD_ONES,
          input: '10110',
        },
        {
          type: 'choice',
          id: 'dfa-delta-star-empty',
          prompt: md`What is $\delta^*(q, \varepsilon)$?`,
          choices: [
            { text: md`$q$`, correct: true, explain: md`Right. Reading nothing leaves the machine where it started.` },
            { text: md`$s$, the start state`, explain: md`$\delta^*$ starts from whatever state $q$ you give it.` },
            { text: 'It is undefined', explain: md`The base case of the definition covers $\varepsilon$.` },
          ],
        },
        {
          type: 'membership',
          id: 'dfa-odd-ones-membership',
          prompt: 'Which strings does the odd-1s machine accept?',
          strings: [
            { w: '1', inL: true },
            { w: '0110', inL: false },
            { w: '111', inL: true },
            { w: '', inL: false },
            { w: '0100', inL: true },
            { w: '11', inL: false },
          ],
        },
      ],
    },
    {
      id: 'designing-dfas',
      title: 'Designing DFAs',
      blocks: [
        {
          type: 'text',
          md: md`The design question is always: **what do I need to remember about the prefix I've read so far?** Each answer
becomes a state. For "ends with \`01\`" it's enough to remember how much of \`01\` the input currently ends with:
nothing useful, a \`0\`, or the whole \`01\`.`,
        },
        {
          type: 'trace',
          id: 'design-trace-ends-01',
          caption: 'A DFA for strings ending in 01, reading 1001',
          dfa: ENDS_01,
          input: '1001',
        },
        {
          type: 'text',
          md: md`When you can't spot a clever summary, a brute-force design always works for "local" properties: let the
state be the last $k$ symbols read. That uses up to $2^k$ states over $\{0, 1\}$ but is easy to get right, and you
can merge equivalent states afterwards.

Before you build, write down in words what each state *means*. A good state description makes both the transitions
and the proof of correctness almost mechanical.`,
        },
        {
          type: 'short',
          id: 'design-states-ends-01',
          prompt: md`What is the fewest number of states a DFA for "ends with \`01\`" can have?`,
          answers: ['3', 'three'],
          explain: md`The three summaries above are all different, since they need different suffixes to be accepted.`,
        },
        {
          type: 'short',
          id: 'design-states-mod-3',
          prompt: md`How many states does the smallest DFA need for "length is a multiple of 3"?`,
          answers: ['3', 'three'],
          explain: md`Remember $|w| \bmod 3$: one state for each remainder 0, 1 and 2.`,
        },
      ],
    },
    {
      id: 'product-construction',
      title: 'The product construction',
      blocks: [
        {
          type: 'text',
          md: md`Suppose $M_1$ and $M_2$ are DFAs over the same alphabet. To run both at once, let a new machine's state be a
**pair** $(p, q)$ with $p$ a state of $M_1$ and $q$ a state of $M_2$, and move both coordinates on every symbol:

$$\delta((p, q), a) = (\delta_1(p, a),\ \delta_2(q, a))$$

Only the accepting set depends on what you want to compute.`,
        },
        {
          type: 'callout',
          kind: 'theorem',
          title: 'Closure under boolean operations',
          md: md`If $L_1$ and $L_2$ are accepted by DFAs, then so are $L_1 \cap L_2$, $L_1 \cup L_2$, $L_1 \setminus L_2$ and
$\overline{L_1}$. Choose accepting pairs where both, either, or only the first coordinate accepts. For the
complement, swap accepting and non-accepting states.`,
        },
        {
          type: 'choice',
          id: 'product-intersection',
          prompt: md`In the product of $M_1$ and $M_2$, which pairs $(p, q)$ should accept to compute $L(M_1) \cap L(M_2)$?`,
          choices: [
            { text: md`$p \in A_1$ and $q \in A_2$`, correct: true, explain: 'Right. Both machines must accept.' },
            { text: md`$p \in A_1$ or $q \in A_2$`, explain: 'That computes the union.' },
            { text: md`$p \in A_1$ and $q \notin A_2$`, explain: md`That computes $L(M_1) \setminus L(M_2)$.` },
          ],
        },
        {
          type: 'short',
          id: 'product-size',
          prompt: md`$M_1$ has 2 states and $M_2$ has 3 states. How many states does their product have?`,
          answers: ['6', 'six'],
          explain: md`One state for every pair: $2 \times 3 = 6$.`,
        },
      ],
    },
    {
      id: 'fooling-sets',
      title: 'Proving a language is not regular',
      blocks: [
        {
          type: 'text',
          md: md`Two strings $x$ and $y$ are **distinguishable** by $L$ if some suffix $z$ puts exactly one of $xz$, $yz$ in
$L$. A DFA for $L$ must end in *different* states after reading $x$ and after reading $y$. If it ended in the same
state, it would treat $xz$ and $yz$ the same way.`,
        },
        {
          type: 'callout',
          kind: 'theorem',
          title: 'Fooling sets',
          md: md`A **fooling set** for $L$ is a set $F$ of strings in which every two distinct strings are distinguishable by
$L$. If $L$ has a fooling set of size $k$, every DFA for $L$ has at least $k$ states. If $L$ has an
**infinite** fooling set, $L$ is not regular.`,
        },
        {
          type: 'text',
          md: md`**Example.** Let $L = \{\texttt{0}^n\texttt{1}^n \mid n \ge 0\}$ and $F = \{\texttt{0}^i \mid i \ge 0\}$. For
$i \ne j$, the suffix $\texttt{1}^i$ gives $\texttt{0}^i\texttt{1}^i \in L$ but $\texttt{0}^j\texttt{1}^i \notin L$.
So $F$ is an infinite fooling set and $L$ is not regular.

The **Myhill–Nerode theorem** sharpens this: the fewest states in any DFA for $L$ equals the largest fooling set
for $L$. In particular, a language is regular exactly when that number is finite.`,
        },
        {
          type: 'choice',
          id: 'fooling-suffix',
          prompt: md`For $L = \{\texttt{0}^n\texttt{1}^n\}$, which suffix distinguishes \`000\` from \`00\`?`,
          choices: [
            { text: md`\`111\``, correct: true, explain: md`Right. \`000111\` is in $L$ but \`00111\` is not.` },
            { text: md`\`0\``, explain: md`Both \`0000\` and \`000\` are outside $L$, so this suffix doesn't separate them.` },
            { text: md`$\varepsilon$`, explain: md`Neither \`000\` nor \`00\` is in $L$.` },
          ],
        },
      ],
    },
    {
      id: 'exercises',
      title: 'Exercises',
      blocks: [
        {
          type: 'text',
          md: md`Build a DFA for each language. Use the canvas or the JSON view. The checker compares your machine with the
target language and shows a string where they disagree.`,
        },
        { type: 'lab', id: 'lab-odd-1s', problem: 'odd-1s' },
        { type: 'lab', id: 'lab-ends-with-01', problem: 'ends-with-01' },
        { type: 'lab', id: 'lab-starts-with-10', problem: 'starts-with-10' },
        { type: 'lab', id: 'lab-exactly-two-1s', problem: 'exactly-two-1s' },
        { type: 'lab', id: 'lab-length-multiple-of-3', problem: 'length-multiple-of-3' },
        { type: 'lab', id: 'lab-no-111', problem: 'no-111' },
        { type: 'lab', id: 'lab-even-0s-even-1s', problem: 'even-0s-even1s' },
      ],
    },
  ],
};
