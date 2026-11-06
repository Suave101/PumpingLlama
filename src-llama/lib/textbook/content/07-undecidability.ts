import type { Chapter } from '../types';
import { md } from '../md';

export const undecidability: Chapter = {
  id: 'undecidability',
  title: 'Undecidability',
  summary: 'Diagonalization, the halting problem, and reductions between problems.',
  sections: [
    {
      id: 'halting-problem',
      title: 'The halting problem',
      blocks: [
        {
          type: 'text',
          md: md`A Turing machine can be written down as a string, $\langle M \rangle$, and a **universal** machine can read such
a description and simulate $M$ on any input. Machines can therefore take other machines, or themselves, as input.`,
        },
        {
          type: 'callout',
          kind: 'theorem',
          title: 'Self-rejection is undecidable',
          md: md`The language $\text{SelfReject} = \{ \langle M \rangle \mid M \text{ rejects } \langle M \rangle \}$ is not
decidable.

*Proof sketch.* Suppose a decider $D$ existed, and run $D$ on its own encoding $\langle D \rangle$. If $D$ accepts
$\langle D \rangle$, then by the definition of the language $D$ rejects $\langle D \rangle$. If $D$ rejects, then
$\langle D \rangle$ is in the language, so $D$ should have accepted. Either way we have a contradiction. $\blacksquare$`,
        },
        {
          type: 'text',
          md: md`This is Cantor's diagonal argument again: list every machine down the side and every input across the top, and
the language disagrees with each machine on the diagonal. The **halting problem**,
$\text{Halt} = \{ \langle M, w \rangle \mid M \text{ halts on } w \}$, is undecidable by the same idea.`,
        },
        {
          type: 'choice',
          id: 'halting-acceptable',
          prompt: 'The halting problem is undecidable. Is it acceptable (recursively enumerable)?',
          choices: [
            { text: 'Yes', correct: true, explain: md`Right. Simulate $M$ on $w$ and accept if it halts. This answers every yes-instance but may loop on no-instances.` },
            { text: 'No', explain: 'A universal machine can confirm halting by waiting for it to happen.' },
          ],
        },
      ],
    },
    {
      id: 'reductions',
      title: 'Reductions',
      blocks: [
        {
          type: 'text',
          md: md`To show a new problem $B$ is undecidable, **reduce** a known undecidable problem $A$ to it. Assume a decider for
$B$ exists, and use it as a subroutine to build a decider for $A$. Since no decider for $A$ exists, none exists for
$B$ either.

The direction matters and is easy to get backwards. You reduce **from** the known-hard problem **to** the new one.
Rice's theorem packages a whole family of these reductions: every nontrivial property of the *language* a Turing
machine accepts is undecidable.`,
        },
        {
          type: 'choice',
          id: 'reduction-direction',
          prompt: 'You want to prove that B is undecidable. Which reduction do you build?',
          choices: [
            { text: 'Use a decider for Halt to decide B', explain: 'That only shows B is no harder than Halt.' },
            { text: 'Use a hypothetical decider for B to decide Halt', correct: true, explain: 'Right. If B were decidable, Halt would be too, which is impossible.' },
          ],
        },
        {
          type: 'choice',
          id: 'reduction-rice',
          prompt: md`Which question is undecidable for an arbitrary Turing machine $M$, by Rice's theorem?`,
          choices: [
            { text: md`Does $M$ have more than 10 states?`, explain: 'This is a property of the description, not of the language, so you can just count.' },
            { text: md`Is $L(M)$ empty?`, correct: true, explain: 'Right. Emptiness is a nontrivial property of the accepted language.' },
            { text: md`Does $M$ move its head on the first step?`, explain: 'Read the start transition and you know.' },
          ],
        },
      ],
    },
  ],
};
