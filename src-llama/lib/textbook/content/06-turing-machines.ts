import type { Chapter, TuringMachine } from '../types';
import { md } from '../md';

// Decides 0ⁿ1ⁿ by crossing off one 0 (X) and one 1 (Y) per pass
const ZERO_N_ONE_N: TuringMachine = {
  start: 'q0',
  accept: 'accept',
  reject: 'reject',
  blank: '□',
  transitions: {
    q0: { '0': ['q1', 'X', 'R'], Y: ['q3', 'Y', 'R'], '□': ['accept', '□', 'R'] },
    q1: { '0': ['q1', '0', 'R'], Y: ['q1', 'Y', 'R'], '1': ['q2', 'Y', 'L'] },
    q2: { '0': ['q2', '0', 'L'], Y: ['q2', 'Y', 'L'], X: ['q0', 'X', 'R'] },
    q3: { Y: ['q3', 'Y', 'R'], '□': ['accept', '□', 'R'] },
  },
};

export const turingMachines: Chapter = {
  id: 'turing-machines',
  title: 'Turing machines',
  summary: 'An unbounded tape and a read-write head: the standard model of general computation.',
  keyIdeas: md`- A Turing machine reads and writes an unbounded tape and moves its head either way. It can accept, reject or run forever.
- Decidable languages have machines that halt on every input; acceptable ones only need to accept their members.
- Extra tapes and other variations change speed, not power. That robustness backs the Church–Turing thesis.`,
  sections: [
    {
      id: 'definitions',
      title: 'Formal definitions',
      blocks: [
        {
          type: 'text',
          md: md`A **Turing machine** is a finite-state control attached to a tape that is infinite in one direction. The tape
starts with the input followed by blanks. On each step the machine reads the symbol under its head, writes a symbol,
moves the head one cell left or right, and changes state. Unlike a DFA it can revisit and overwrite its input, and it
might never stop.`,
        },
        {
          type: 'callout',
          kind: 'definition',
          title: 'Turing machine',
          md: md`A Turing machine is a tuple $(\Gamma, \square, \Sigma, Q, \text{start}, \text{accept}, \text{reject}, \delta)$:
a tape alphabet $\Gamma$ containing the blank $\square$ and the input alphabet $\Sigma$, a finite state set $Q$ with
three special states, and a transition function

$$\delta : (Q \setminus \{\text{accept}, \text{reject}\}) \times \Gamma \to Q \times \Gamma \times \{-1, +1\}.$$`,
        },
        {
          type: 'text',
          md: md`On input $w$ the machine either **accepts** (reaches the accept state), **rejects** (reaches the reject state),
or **runs forever**. A language is **acceptable** (recursively enumerable) if some machine accepts exactly its
strings, and **decidable** if some machine accepts its strings *and halts on every input*.

A standard first example decides $\{\texttt{0}^n\texttt{1}^n\}$: repeatedly cross off the leftmost \`0\` (write
\`X\`) and the leftmost \`1\` (write \`Y\`), and accept if both run out at the same time. The states have jobs:

| State | Job |
|---|---|
| \`q0\` | Cross off the next \`0\`, or check that only \`Y\`s are left |
| \`q1\` | Scan right to the first \`1\` and cross it off |
| \`q2\` | Scan back left to the last \`X\` |
| \`q3\` | Confirm nothing but \`Y\`s remains before the blank |`,
        },
        {
          type: 'tm-trace',
          id: 'tm-trace-0n1n',
          caption: 'A Turing machine deciding 0ⁿ1ⁿ, running on 0011',
          machine: ZERO_N_ONE_N,
          input: '0011',
        },
        {
          type: 'tm-trace',
          id: 'tm-trace-0n1n-reject',
          caption: 'The same machine on 0010: watch where it gets stuck',
          machine: ZERO_N_ONE_N,
          input: '0010',
        },
        {
          type: 'short',
          id: 'tm-trace-xs',
          prompt: md`When the machine accepts \`0011\`, how many \`X\`s are on the tape?`,
          answers: ['2', 'two'],
          explain: md`One \`X\` for each \`0\` it crossed off.`,
        },
        {
          type: 'choice',
          id: 'tm-outcomes',
          prompt: 'Which outcome is possible for a Turing machine but not for a DFA?',
          choices: [
            { text: 'Rejecting its input', explain: 'DFAs reject inputs all the time.' },
            { text: 'Running forever without answering', correct: true, explain: 'Right. A DFA always halts after reading its input. A Turing machine might loop.' },
            { text: 'Accepting the empty string', explain: 'A DFA accepts ε when its start state is accepting.' },
          ],
        },
        {
          type: 'choice',
          id: 'tm-decidable-vs-acceptable',
          prompt: 'What separates a decidable language from one that is merely acceptable?',
          choices: [
            { text: 'Its machine halts on every input', correct: true, explain: 'Right. A decider never loops, so it rejects non-members explicitly.' },
            { text: 'Its machine uses only one tape', explain: 'The number of tapes doesn’t change which languages can be decided.' },
            { text: 'It is a finite language', explain: 'Many infinite languages are decidable.' },
          ],
        },
      ],
    },
    {
      id: 'simulator',
      title: 'Build and run your own machine',
      blocks: [
        {
          type: 'text',
          md: md`The best way to understand Turing machines is to write a few. The simulator below runs any single-tape
machine you describe, on any input you type. Each line of the machine is one transition, written the way we have
been writing them:

\`\`\`
q1, 0 -> q1, 0, R     # in q1 reading 0: stay in q1, write 0, move right
q1, 1 -> q2, Y, L     # in q1 reading 1: go to q2, write Y, move left
\`\`\`

The machine starts in the state named by \`start:\` (or the first rule's state), and halts when it enters \`accept\`
or \`reject\`. If no rule matches the current state and symbol, the machine rejects, so you only need to write the
transitions that matter. Use \`_\` for a blank cell.

Pick a starting machine from the menu, press **Run**, then step through it or press **Play**. The highlighted rule in
the rule list is the one about to fire.`,
        },
        { type: 'tm-playground', preset: 'zero-n-one-n' },
        {
          type: 'callout',
          kind: 'note',
          title: 'Try these',
          md: md`1. Load **0ⁿ1ⁿ** and run it on \`0101\`. Which rule is missing when it rejects?
2. Load **Add one** and run it on \`111\` (that is $7$, written least significant bit first). Read the answer off the tape.
3. Change **0ⁿ1ⁿ** so that it accepts $\{\texttt{0}^n\texttt{1}^{2n}\}$: cross off two \`1\`s for every \`0\`.
4. Write a machine that accepts binary strings with an even number of \`1\`s *without ever moving left*. What kind
   of machine from earlier chapters have you just built?`,
        },
        {
          type: 'short',
          id: 'simulator-increment',
          prompt: md`Run **Add one** on \`111\`. What is on the tape when it accepts?`,
          answers: ['0001'],
          explain: md`The carry turns each \`1\` into \`0\` and finally writes a \`1\` on the first blank. Least significant bit first, \`0001\` is $8 = 7 + 1$.`,
        },
        {
          type: 'short',
          id: 'simulator-palindrome-stuck',
          prompt: md`Run **Palindromes** on \`aab\`. In which state is the machine when it finds no rule and rejects?`,
          answers: ['ca'],
          explain: md`It erases the first \`a\`, runs right to the end in \`ra\`, steps back into \`ca\` and reads \`b\`. State \`ca\` expects an \`a\`, so there is no rule.`,
        },
        {
          type: 'choice',
          id: 'simulator-gives-up',
          prompt: md`On the **Runs forever** machine, the simulator stops after a fixed number of steps and says it has no answer, instead of reporting "this machine loops". Why?`,
          choices: [
            { text: 'The simulator runs out of memory', explain: md`The step limit is chosen long before memory becomes an issue.` },
            {
              text: 'No program can decide, for every machine and input, whether the machine will halt',
              correct: true,
              explain: md`Right. This particular loop is easy to spot, but the halting problem (Chapter 7) shows that no simulator can detect every infinite run.`,
            },
            { text: 'Machines that loop always reject eventually', explain: md`A looping machine never enters reject; it simply never halts.` },
          ],
        },
      ],
    },
    {
      id: 'variations',
      title: 'Variations and the Church–Turing thesis',
      blocks: [
        {
          type: 'text',
          md: md`Many variations of the model compute exactly the same languages: tapes that are infinite in both directions,
several tapes, a head that may stay put, larger tape alphabets, even a two-dimensional grid. Each one can be
simulated by the basic model, usually with a polynomial slowdown.

That robustness is the evidence for the **Church–Turing thesis**: anything that can be computed by a mechanical
procedure can be computed by a Turing machine. It is not a theorem, since "mechanical procedure" has no formal
definition. It is the reason Turing machines are the yardstick for the next chapter.`,
        },
        {
          type: 'choice',
          id: 'tm-multitape',
          prompt: 'Compared with one-tape Turing machines, multi-tape Turing machines can decide…',
          choices: [
            { text: 'strictly more languages', explain: 'A one-tape machine can simulate several tapes on one tape by interleaving them.' },
            { text: 'exactly the same languages, sometimes faster', correct: true, explain: 'Right. Extra tapes can change running time but not computability.' },
            { text: 'fewer languages', explain: 'A multi-tape machine can ignore its extra tapes.' },
          ],
        },
      ],
    },
  ],
};
