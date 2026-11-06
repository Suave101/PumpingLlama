import type { Chapter } from '../types';
import { md } from '../md';

export const turingMachines: Chapter = {
  id: 'turing-machines',
  title: 'Turing machines',
  summary: 'An unbounded tape and a read-write head: the standard model of general computation.',
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

A standard first example decides $\{\texttt{0}^n\texttt{1}^n\}$: repeatedly cross off the leftmost \`0\` and the
leftmost \`1\`, and accept if both run out at the same time.`,
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
