import type { Chapter } from '../types';
import { md } from '../md';

export const nondeterministicAutomata: Chapter = {
  id: 'nondeterministic-automata',
  title: 'Nondeterministic automata',
  summary: 'NFAs, ε-transitions, and Kleene’s theorem connecting automata and regular expressions.',
  sections: [
    {
      id: 'nfas',
      title: 'Nondeterministic finite automata',
      blocks: [
        {
          type: 'text',
          md: md`A **nondeterministic** finite automaton may have zero, one or several transitions out of a state on the same
symbol, and may also move without reading anything along an **ε-transition**. It accepts $w$ if **at least one**
way of reading $w$ ends in an accepting state.

There are two useful ways to picture this. Either the machine *guesses* correctly at every choice, or it runs every
choice in parallel and accepts if any copy does. Neither picture is how a real computer runs it. Nondeterminism is
a design tool, not hardware.`,
        },
        {
          type: 'callout',
          kind: 'definition',
          title: 'NFA',
          md: md`An NFA is a tuple $(\Sigma, Q, s, A, \delta)$ where $\delta : Q \times (\Sigma \cup \{\varepsilon\}) \to 2^Q$
returns a **set** of states. The **ε-closure** of a state $q$ is the set of states reachable from $q$ using only
ε-transitions.`,
        },
        {
          type: 'text',
          md: md`**Example.** "The second-to-last symbol is \`1\`" needs 4 states as a DFA, since it must remember the last two
symbols. As an NFA it needs 3: stay in the start state on anything, then *guess* that the current \`1\` is the
second-to-last symbol and check that exactly one more symbol follows.`,
        },
        {
          type: 'membership',
          id: 'nfa-second-from-end',
          prompt: 'Which strings have 1 as their second-to-last symbol?',
          strings: [
            { w: '10', inL: true },
            { w: '11', inL: true },
            { w: '01', inL: false },
            { w: '1', inL: false },
            { w: '0110', inL: true },
            { w: '100', inL: false },
          ],
        },
        {
          type: 'choice',
          id: 'nfa-acceptance',
          prompt: 'An NFA reading w has some runs that end in accepting states and some that get stuck. Does it accept w?',
          choices: [
            { text: 'Yes', correct: true, explain: 'Right. One accepting run is enough.' },
            { text: 'No', explain: 'Rejected runs and stuck runs don’t matter if any run accepts.' },
            { text: 'Only if no run gets stuck', explain: 'A stuck run simply dies. It does not cause rejection by itself.' },
          ],
        },
      ],
    },
    {
      id: 'kleenes-theorem',
      title: 'Kleene’s theorem',
      blocks: [
        {
          type: 'callout',
          kind: 'theorem',
          title: 'Kleene’s theorem',
          md: md`For every language $L$, the following are equivalent:

1. $L$ is described by a regular expression.
2. $L$ is accepted by an NFA.
3. $L$ is accepted by a DFA.`,
        },
        {
          type: 'text',
          md: md`Each arrow in the cycle is an algorithm:

- **NFA to DFA, the subset construction.** A DFA state is a *set* of NFA states: everywhere the NFA could be right
  now. Start from the ε-closure of $s$. On symbol $a$, move every state in the set along $a$ and take the ε-closure.
  Accept any set containing an accepting state. An $n$-state NFA gives at most $2^n$ DFA states.
- **Regular expression to NFA, Thompson's algorithm.** Build an NFA for each piece of the expression and glue the
  pieces together with ε-transitions. A union branches, a concatenation chains, a star loops.
- **DFA to regular expression, state elimination.** Allow regular expressions on edges, then delete states one at a
  time and patch the expressions around each removed state, until one edge from start to finish remains.`,
        },
        {
          type: 'short',
          id: 'kleene-subset-bound',
          prompt: md`The subset construction is applied to a 3-state NFA. At most how many states can the resulting DFA have?`,
          answers: ['8', 'eight', '2^3'],
          explain: md`One DFA state for each subset of the 3 NFA states: $2^3 = 8$.`,
        },
        {
          type: 'choice',
          id: 'kleene-subset-accept',
          prompt: 'In the subset construction, which DFA states are accepting?',
          choices: [
            { text: 'Sets containing at least one accepting NFA state', correct: true, explain: 'Right. Some run of the NFA is in an accepting state.' },
            { text: 'Sets where every NFA state is accepting', explain: 'One accepting run suffices, so one accepting state in the set suffices.' },
            { text: 'Only the set of all NFA states', explain: 'Acceptance depends on whether an accepting state is in the set.' },
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
          md: md`The first three exercises go from a regular expression or a property to an automaton. The last two go the
other way: turn the given DFA into a regular expression.`,
        },
        { type: 'lab', id: 'lab-second-from-end-is-1', problem: 'second-from-end-is-1' },
        { type: 'lab', id: 'lab-regex-0-star-11', problem: 'regex-0-star-11' },
        { type: 'lab', id: 'lab-regex-1-0-star-0', problem: 'regex-1-0-star-0' },
        { type: 'lab', id: 'lab-contains-00', problem: 'contains-00' },
        { type: 'lab', id: 'lab-ends-with-00', problem: 'ends-with-00' },
      ],
    },
  ],
};
