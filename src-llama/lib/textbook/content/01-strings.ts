import type { Chapter } from '../types';
import { md } from '../md';

export const strings: Chapter = {
  id: 'strings',
  title: 'Strings',
  summary: 'Recursive definitions of strings, length and concatenation, and how to prove things about them by induction.',
  sections: [
    {
      id: 'strings-and-alphabets',
      title: 'Strings and alphabets',
      blocks: [
        {
          type: 'text',
          md: md`Every input a computer ever reads is, in the end, a finite sequence of symbols. Before we can say anything
precise about machines, we need a precise way to talk about those sequences.

Fix a finite, nonempty set $\Sigma$ called the **alphabet**. Its elements are **symbols**. Throughout this book we
mostly use $\Sigma = \{0, 1\}$ or $\Sigma = \{a, b\}$, and we write explicit strings in monospace, like \`0110\`.`,
        },
        {
          type: 'callout',
          kind: 'definition',
          title: 'String',
          md: md`A **string** over $\Sigma$ is either

- the **empty string** $\varepsilon$, or
- a pair $a \cdot x$, where $a \in \Sigma$ is a symbol and $x$ is a string over $\Sigma$.

The set of all strings over $\Sigma$ is written $\Sigma^*$.`,
        },
        {
          type: 'text',
          md: md`The definition is recursive on purpose: it tells us exactly how every string is built, which is what lets us
prove things about *all* strings later. Notice that $\Sigma^*$ is infinite, but every individual string in it is
finite. An endless sequence \`000…\` is not a string.

Two functions come up constantly. The **length** of a string counts its symbols:

$$|w| = \begin{cases} 0 & \text{if } w = \varepsilon \\ 1 + |x| & \text{if } w = a \cdot x \end{cases}$$

**Concatenation** glues two strings together, so $x \cdot y$ (or just $xy$) is $x$ followed by $y$:

$$w \cdot z = \begin{cases} z & \text{if } w = \varepsilon \\ a \cdot (x \cdot z) & \text{if } w = a \cdot x \end{cases}$$`,
        },
        {
          type: 'choice',
          id: 'strings-not-in-sigma-star',
          prompt: md`Let $\Sigma = \{0, 1\}$. Which of these is **not** an element of $\Sigma^*$?`,
          choices: [
            { text: md`$\varepsilon$`, explain: md`The empty string is a string over every alphabet.` },
            { text: md`\`0101\``, explain: md`A finite sequence of symbols from $\Sigma$, so it is in $\Sigma^*$.` },
            {
              text: md`The infinite sequence \`000…\``,
              correct: true,
              explain: md`Right. Every string is finite, even though $\Sigma^*$ contains strings of every length.`,
            },
            { text: md`\`1\``, explain: md`A single symbol is a string of length 1.` },
          ],
        },
        {
          type: 'short',
          id: 'strings-count-length-3',
          prompt: md`How many strings of length exactly 3 are there over $\Sigma = \{0, 1\}$?`,
          answers: ['8'],
          explain: md`Each of the three positions has 2 choices, so there are $2^3 = 8$.`,
        },
        {
          type: 'short',
          id: 'strings-concat-length',
          prompt: md`What is $|\texttt{abb} \cdot \varepsilon \cdot \texttt{ba}|$?`,
          answers: ['5'],
          explain: md`Concatenating with $\varepsilon$ changes nothing, and $|\texttt{abbba}| = 5$.`,
        },
      ],
    },
    {
      id: 'induction-on-strings',
      title: 'Induction on strings',
      blocks: [
        {
          type: 'text',
          md: md`Because strings are defined recursively, the natural way to prove a claim about every string is induction
whose cases copy the definition. A proof about an arbitrary string $w$ has two cases: $w = \varepsilon$, or
$w = a \cdot x$ for some symbol $a$ and string $x$.

Use the strongest hypothesis available: *assume the claim holds for every string shorter than $w$.* In the case
$w = a \cdot x$ we have $|x| = |w| - 1$, so the hypothesis covers $x$.`,
        },
        {
          type: 'callout',
          kind: 'theorem',
          title: 'Length is additive',
          md: md`For all strings $w$ and $z$, $|w \cdot z| = |w| + |z|$.

*Proof.* Let $w$ and $z$ be arbitrary, and assume the claim for every string shorter than $w$.

- If $w = \varepsilon$: $|w \cdot z| = |z| = 0 + |z| = |w| + |z|$.
- If $w = a \cdot x$: $|w \cdot z| = |a \cdot (x \cdot z)| = 1 + |x \cdot z| = 1 + |x| + |z| = |w| + |z|$,
  using the inductive hypothesis for $x$ in the third step. $\blacksquare$`,
        },
        {
          type: 'text',
          md: md`The same pattern proves that concatenation is associative, that $w \cdot \varepsilon = w$, and many facts about
the **reversal** $w^R$, defined by $\varepsilon^R = \varepsilon$ and $(a \cdot x)^R = x^R \cdot a$.

A few more words we will use: $x$ is a **substring** of $w$ if $w = pxs$ for some strings $p, s$. It is a
**prefix** if $p = \varepsilon$ and a **suffix** if $s = \varepsilon$. A **subsequence** may skip symbols but must
keep their order.`,
        },
        {
          type: 'choice',
          id: 'induction-case-structure',
          prompt: md`You want to prove a property of every string $w$ by induction. Which pair of cases mirrors the definition of a string?`,
          choices: [
            { text: md`$|w| = 1$ and $|w| = 2$`, explain: md`These cases miss $\varepsilon$ and every longer string.` },
            {
              text: md`$w = \varepsilon$, and $w = a \cdot x$ for a symbol $a$ and string $x$`,
              correct: true,
              explain: md`Right. Every string is exactly one of these, and $x$ is shorter than $w$.`,
            },
            { text: md`$w$ is a palindrome, and $w$ is not`, explain: md`This split doesn't give you a smaller string to apply the hypothesis to.` },
          ],
        },
        {
          type: 'short',
          id: 'induction-reversal',
          prompt: md`Using the recursive definition of reversal, what is $(\texttt{abc})^R$?`,
          answers: ['cba'],
          explain: md`$(\texttt{a} \cdot \texttt{bc})^R = (\texttt{bc})^R \cdot \texttt{a} = \texttt{c} \cdot \texttt{b} \cdot \texttt{a}$.`,
        },
        {
          type: 'choice',
          id: 'induction-substring-subsequence',
          prompt: md`In the string \`abc\`, the string \`ac\` is…`,
          choices: [
            { text: 'a substring and a subsequence', explain: md`\`ac\` does not appear contiguously in \`abc\`.` },
            { text: 'a subsequence but not a substring', correct: true, explain: md`Right. Delete the \`b\` to get \`ac\`, but the symbols aren't adjacent.` },
            { text: 'neither', explain: md`Deleting symbols while keeping order gives a subsequence.` },
          ],
        },
      ],
    },
  ],
};
