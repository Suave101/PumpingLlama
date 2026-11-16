import type { Chapter } from '../types';
import { md } from '../md';

export const strings: Chapter = {
  id: 'strings',
  title: 'Strings',
  summary: 'Recursive definitions of strings, length, concatenation and reversal, and how to prove things about them by induction.',
  keyIdeas: md`- A string is either $\varepsilon$ or a symbol followed by a string. Every string is finite, but $\Sigma^*$ is infinite.
- Length, concatenation and reversal are defined by recursion on that structure; $|\Sigma^n| = |\Sigma|^n$.
- Proofs about all strings use induction with the same two cases, assuming the claim for every shorter string.
- Induct on the argument the definitions recurse on. For $w \cdot z$ that is $w$, which is how $(wz)^R = z^R w^R$ is proved.
- A nonempty string is also a single symbol or a concatenation of two nonempty strings. Inducting on that split needs a hypothesis strong enough for every combination of pieces.
- $w_i$ and $w[i..j]$ name symbols and slices; every substring is a subsequence, but not conversely.
- Any function defined by cases on $\varepsilon$ and $a \cdot x$ is defined for every string, and facts about it are proved with the same cases.
- A recursively defined set contains exactly what its rules build, so structural induction proves facts about all its members.`,
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

$$w \cdot z = \begin{cases} z & \text{if } w = \varepsilon \\ a \cdot (x \cdot z) & \text{if } w = a \cdot x \end{cases}$$

Notice that concatenation recurses on its *left* argument. To simplify $w \cdot z$ you only need to know the shape of
$w$; the string $z$ just rides along. That detail decides how proofs about concatenation must be set up.`,
        },
        {
          type: 'text',
          md: md`A little more notation saves a lot of writing:

- $a^n$ is the symbol $a$ repeated $n$ times, so $\texttt{0}^3 = \texttt{000}$.
- $w^n$ is $w$ concatenated with itself $n$ times, with $w^0 = \varepsilon$. So $(\texttt{ab})^2 = \texttt{abab}$,
  which is different from $\texttt{ab}^2 = \texttt{abb}$.
- $\Sigma^n$ is the set of strings of length exactly $n$, and $\Sigma^+$ is the set of *nonempty* strings.

Since each of the $n$ positions holds one of $|\Sigma|$ symbols, $|\Sigma^n| = |\Sigma|^n$. In particular
$\Sigma^0 = \{\varepsilon\}$ has exactly one element.`,
        },
        {
          type: 'callout',
          kind: 'note',
          md: md`Strictly speaking, the symbol $\texttt{0}$ and the length-1 string $\texttt{0} \cdot \varepsilon$ are different
objects. Everyone blurs the two, and so will we. The empty string is never a symbol, though: $\varepsilon \notin \Sigma$.`,
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
        {
          type: 'short',
          id: 'strings-power',
          prompt: md`Write out $(\texttt{ab})^3$.`,
          answers: ['ababab'],
          explain: md`Three copies of \`ab\` in a row. Compare $\texttt{ab}^3 = \texttt{abbb}$, where the power applies only to \`b\`.`,
        },
        {
          type: 'short',
          id: 'strings-count-at-most-2',
          prompt: md`Over $\Sigma = \{0, 1\}$, how many strings have length **at most** 2?`,
          answers: ['7'],
          explain: md`$|\Sigma^0| + |\Sigma^1| + |\Sigma^2| = 1 + 2 + 4 = 7$. Don't forget $\varepsilon$.`,
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
keep their order. Section 1.5 makes all of these precise.`,
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
        {
          type: 'short',
          id: 'induction-prefix-count',
          prompt: md`How many prefixes does \`abba\` have? Count $\varepsilon$ and \`abba\` itself.`,
          answers: ['5'],
          explain: md`$\varepsilon$, \`a\`, \`ab\`, \`abb\`, \`abba\`. A string of length $n$ always has $n + 1$ prefixes.`,
        },
        {
          type: 'membership',
          id: 'induction-substrings-banana',
          prompt: md`Mark each string that is a **substring** of \`banana\`.`,
          strings: [
            { w: 'nan', inL: true },
            { w: 'bn', inL: false },
            { w: '', inL: true },
            { w: 'ana', inL: true },
            { w: 'nb', inL: false },
            { w: 'banana', inL: true },
          ],
        },
      ],
    },
    {
      id: 'reversal',
      title: 'Reversal and concatenation',
      blocks: [
        {
          type: 'text',
          md: md`One proof is rarely enough. Facts about strings build on each other, and a larger proof usually cites a few
smaller lemmas. This section works through one complete example: reversing a concatenation reverses the order of
the pieces,

$$(w \cdot z)^R = z^R \cdot w^R.$$

Try it on $w = \texttt{ab}$ and $z = \texttt{cd}$: $(\texttt{abcd})^R = \texttt{dcba} = \texttt{dc} \cdot \texttt{ba}$.
The proof needs two lemmas first, each a short induction of its own.`,
        },
        {
          type: 'callout',
          kind: 'theorem',
          title: 'Empty string is a right identity',
          md: md`For every string $w$, $w \cdot \varepsilon = w$.

*Proof.* Assume the claim for every string shorter than $w$.

- If $w = \varepsilon$: $\varepsilon \cdot \varepsilon = \varepsilon$ by the definition of concatenation.
- If $w = a \cdot x$: $w \cdot \varepsilon = a \cdot (x \cdot \varepsilon) = a \cdot x = w$, by the inductive
  hypothesis for $x$. $\blacksquare$`,
        },
        {
          type: 'callout',
          kind: 'theorem',
          title: 'Concatenation is associative',
          md: md`For all strings $w$, $y$ and $z$, $(w \cdot y) \cdot z = w \cdot (y \cdot z)$.

*Proof.* Induct on $w$, assuming the claim for every shorter string.

- If $w = \varepsilon$: both sides equal $y \cdot z$.
- If $w = a \cdot x$: $(w \cdot y) \cdot z = (a \cdot (x \cdot y)) \cdot z = a \cdot ((x \cdot y) \cdot z) = a \cdot (x \cdot (y \cdot z)) = w \cdot (y \cdot z)$,
  using the hypothesis for $x$ in the third step. $\blacksquare$`,
        },
        {
          type: 'text',
          md: md`Associativity is why we can drop parentheses and write $wyz$. With both lemmas in hand, the main proof is a
chain of equalities in which every step has a reason.`,
        },
        {
          type: 'callout',
          kind: 'theorem',
          title: 'Reversal of a concatenation',
          md: md`For all strings $w$ and $z$, $(w \cdot z)^R = z^R \cdot w^R$.

*Proof.* Let $z$ be arbitrary. Induct on $w$, assuming the claim for every string shorter than $w$.

- If $w = \varepsilon$: $(\varepsilon \cdot z)^R = z^R = z^R \cdot \varepsilon = z^R \cdot \varepsilon^R$, using the
  right-identity lemma.
- If $w = a \cdot x$:

$$
\begin{aligned}
(w \cdot z)^R &= (a \cdot (x \cdot z))^R && \text{definition of } \cdot \\
&= (x \cdot z)^R \cdot a && \text{definition of } {}^R \\
&= (z^R \cdot x^R) \cdot a && \text{inductive hypothesis} \\
&= z^R \cdot (x^R \cdot a) && \text{associativity} \\
&= z^R \cdot w^R && \text{definition of } {}^R. \quad \blacksquare
\end{aligned}
$$`,
        },
        {
          type: 'callout',
          kind: 'note',
          title: 'Writing an inductive proof',
          md: md`1. State the claim for an **arbitrary** string, and say which string you induct on.
2. Write the inductive hypothesis out in full: *assume the claim for every string shorter than $w$.*
3. Split into exactly the cases of the definition, $w = \varepsilon$ and $w = a \cdot x$.
4. Justify every step, and point to the step where the hypothesis is used.

Pick the variable that the definitions recurse on. Concatenation peels symbols off its left argument, so proofs
about $w \cdot z$ induct on $w$. Inducting on $z$ instead leaves you with $w \cdot (a \cdot y)$, which no definition
simplifies.`,
        },
        {
          type: 'choice',
          id: 'reversal-which-variable',
          prompt: md`Why does the proof of $(w \cdot z)^R = z^R \cdot w^R$ induct on $w$ rather than $z$?`,
          choices: [
            {
              text: md`Concatenation is defined by recursion on its left argument, so $w \cdot z$ only simplifies once we know the shape of $w$`,
              correct: true,
              explain: md`Right. Splitting $w$ into $a \cdot x$ lets us rewrite $w \cdot z$ as $a \cdot (x \cdot z)$.`,
            },
            { text: md`$w$ is always shorter than $z$`, explain: md`The claim is for arbitrary strings; either one may be longer.` },
            { text: md`Either choice works equally well`, explain: md`With $z = a \cdot y$ there is no rule for simplifying $w \cdot (a \cdot y)$.` },
          ],
        },
        {
          type: 'choice',
          id: 'reversal-hypothesis-step',
          prompt: md`In the case $w = a \cdot x$, which step uses the inductive hypothesis?`,
          choices: [
            { text: md`$(a \cdot (x \cdot z))^R = (x \cdot z)^R \cdot a$`, explain: md`That is just the definition of reversal.` },
            {
              text: md`$(x \cdot z)^R \cdot a = (z^R \cdot x^R) \cdot a$`,
              correct: true,
              explain: md`Right. $x$ is shorter than $w$, so the claim already holds for $x$ and $z$.`,
            },
            { text: md`$(z^R \cdot x^R) \cdot a = z^R \cdot (x^R \cdot a)$`, explain: md`That step is associativity, a separate lemma.` },
          ],
        },
        {
          type: 'callout',
          kind: 'theorem',
          title: 'Reversing twice',
          md: md`For every string $w$, $|w^R| = |w|$ and $(w^R)^R = w$.

*Proof of the second claim.* Assume it for every string shorter than $w$.

- If $w = \varepsilon$: $(\varepsilon^R)^R = \varepsilon^R = \varepsilon$.
- If $w = a \cdot x$: $(w^R)^R = (x^R \cdot a)^R = a^R \cdot (x^R)^R = a \cdot x = w$. The second step is the theorem
  above, the third uses $a^R = (a \cdot \varepsilon)^R = \varepsilon^R \cdot a = a$ and the inductive hypothesis
  for $x$. $\blacksquare$

The first claim is a similar induction, using that length is additive.`,
        },
        {
          type: 'text',
          md: md`A **palindrome** is a string that equals its own reversal, like \`racecar\` or \`0110\`. The two theorems
together show that $w \cdot w^R$ is always a palindrome: $(w \cdot w^R)^R = (w^R)^R \cdot w^R = w \cdot w^R$.`,
        },
        {
          type: 'membership',
          id: 'reversal-palindromes',
          prompt: md`Mark each palindrome.`,
          strings: [
            { w: '', inL: true },
            { w: 'a', inL: true },
            { w: 'abba', inL: true },
            { w: 'abab', inL: false },
            { w: 'aba', inL: true },
            { w: 'ab', inL: false },
          ],
        },
      ],
    },
    {
      id: 'splitting-strings',
      title: 'Another way to split a string',
      blocks: [
        {
          type: 'text',
          md: md`Peeling off the first symbol is not the only way to break a string into smaller pieces. Here is a second
decomposition, which you can prove from the definitions as an exercise:

> A string $w$ is nonempty if and only if $w = a$ for a single symbol $a$, or $w = x \cdot y$ for two **nonempty**
> strings $x$ and $y$.

In the second case, additivity of length gives $|x| < |w|$ and $|y| < |w|$, so an inductive hypothesis about
shorter strings applies to *both* pieces. That makes this split the natural one for functions that cut a string in
the middle, the way merge sort cuts an array.`,
        },
        {
          type: 'callout',
          kind: 'theorem',
          title: 'Associativity by splitting',
          md: md`Here is a second proof that $(w \cdot x) \cdot y = w \cdot (x \cdot y)$ for all strings $w$, $x$ and $y$.

*Proof.* Assume $(z \cdot x') \cdot y' = z \cdot (x' \cdot y')$ for **all** strings $x'$, $y'$ and every string $z$ shorter than $w$.

- If $w = \varepsilon$: both sides equal $x \cdot y$.
- If $w = a$ for a symbol $a$: $(a \cdot x) \cdot y = a \cdot (x \cdot y)$ directly from the definition of concatenation.
- If $w = u \cdot v$ for nonempty $u$ and $v$, each shorter than $w$:

$$
\begin{aligned}
((u \cdot v) \cdot x) \cdot y &= (u \cdot (v \cdot x)) \cdot y && \text{hypothesis for } u \\
&= u \cdot ((v \cdot x) \cdot y) && \text{hypothesis for } u \\
&= u \cdot (v \cdot (x \cdot y)) && \text{hypothesis for } v \\
&= (u \cdot v) \cdot (x \cdot y) && \text{hypothesis for } u. \quad \blacksquare
\end{aligned}
$$`,
        },
        {
          type: 'callout',
          kind: 'note',
          md: md`Look at the hypothesis carefully. The first proof only ever applied it to $x$ with the same second and third
arguments. This one applies it to $u$ with $v$ and $x$ in the other slots, so the hypothesis has to hold for every
choice of the other arguments. When a proof calls the hypothesis on pieces in new combinations, make it strong
enough to cover them.`,
        },
        {
          type: 'choice',
          id: 'split-stronger-hypothesis',
          prompt: md`Why does the split proof need a hypothesis that holds for *all* strings $x'$ and $y'$, not just the given $x$ and $y$?`,
          choices: [
            {
              text: md`It applies the hypothesis to shorter strings with different arguments, such as $(u \cdot v) \cdot x$`,
              correct: true,
              explain: md`Right. The first step uses the claim for $u$, $v$ and $x$, which are not the original $w$, $x$, $y$.`,
            },
            { text: md`Because $u$ and $v$ might be empty`, explain: md`The split case requires both pieces to be nonempty.` },
            { text: md`It doesn't; the weaker hypothesis works too`, explain: md`Then the first step, which uses $v$ in the middle slot, would be unjustified.` },
          ],
        },
        {
          type: 'choice',
          id: 'split-missing-case',
          prompt: md`A proof uses only two cases: $w = \varepsilon$, and $w = x \cdot y$ for nonempty $x$ and $y$. Which strings does it never handle?`,
          choices: [
            { text: 'Strings of odd length', explain: md`\`abc\` = \`a\` · \`bc\` is covered by the split case.` },
            { text: 'Single symbols', correct: true, explain: md`Right. A one-symbol string can't be cut into two nonempty pieces, so it needs its own case.` },
            { text: 'None; the two cases cover everything', explain: md`Try writing \`a\` as a concatenation of two nonempty strings.` },
          ],
        },
        {
          type: 'short',
          id: 'split-count-ways',
          prompt: md`In how many ways can \`abcd\` be written as $x \cdot y$ with $x$ and $y$ both nonempty?`,
          answers: ['3'],
          explain: md`Cut after the first, second or third symbol. A string of length $n \ge 1$ has $n - 1$ such splits.`,
        },
      ],
    },
    {
      id: 'indices-substrings',
      title: 'Indices, substrings and subsequences',
      blocks: [
        {
          type: 'text',
          md: md`Programs talk about "the $i$th character" all the time, so we need that too. For $1 \le i \le |w|$, the
symbol $w_i$ is defined by recursion:

$$w_i = \begin{cases} a & \text{if } w = a \cdot x \text{ and } i = 1 \\ x_{i-1} & \text{if } w = a \cdot x \text{ and } i > 1 \end{cases}$$

There is no case for $w = \varepsilon$, so $w_i$ is undefined when $i < 1$ and, by induction, when $i > |w|$. We often
write $w = w_1 w_2 \cdots w_n$ or $w[1 .. n]$ with $n = |w|$. Both notations quietly suggest that $w$ has several
symbols; always remember that $n$ might be $0$.

The **slice** $w[i .. j]$ is the piece from $w_i$ to $w_j$, defined as $\varepsilon$ when $j < i$ and as
$w_i \cdot w[i+1 .. j]$ otherwise. It has length $j - i + 1$ when $i \le j + 1$.`,
        },
        {
          type: 'callout',
          kind: 'definition',
          title: 'Substring, prefix and suffix',
          md: md`- $y$ is a **substring** of $w$ if $w = xyz$ for some strings $x$ and $z$; equivalently, $y = w[i .. j]$ for some $i, j$.
- $p$ is a **prefix** of $w$ if $w = px$ for some $x$, and $s$ is a **suffix** if $w = xs$ for some $x$.
- A **proper** substring, prefix or suffix is one other than $w$ itself. If $y$ is a substring of $w$, then $w$ is a
  **superstring** of $y$.`,
        },
        {
          type: 'callout',
          kind: 'definition',
          title: 'Subsequence',
          md: md`$z$ is a **subsequence** of $w$ if

- $z = \varepsilon$, or
- $w = a \cdot x$ and $z$ is a subsequence of $x$ (skip the first symbol of $w$), or
- $w = a \cdot x$, $z = a \cdot y$, and $y$ is a subsequence of $x$ (match the first symbols).

A **proper** subsequence is one other than $w$ itself, and $w$ is a **supersequence** of each of its subsequences.`,
        },
        {
          type: 'text',
          md: md`Every substring is a subsequence, but not the other way around: \`ace\` is a subsequence of \`abcde\` but not
a substring. When the difference matters, people say *contiguous* substring for emphasis.

Counting these objects is a good warm-up for later chapters. A string of length $n$ has exactly $n + 1$ prefixes
and exactly $n$ proper suffixes. It has at most $n(n+1)/2$ distinct nonempty substrings, one for each pair
$i \le j$, and at most $2^n - 1$ distinct proper subsequences, one for each proper subset of positions. The bounds
say "at most" because different positions can produce the same string: \`aaa\` has only three distinct nonempty
substrings, not six.`,
        },
        {
          type: 'callout',
          kind: 'theorem',
          title: 'Substrings of a concatenation',
          md: md`A string $x$ is a substring of $u \cdot v$ if and only if

- $x$ is a substring of $u$, or
- $x$ is a substring of $v$, or
- $x = yz$, where $y$ is a suffix of $u$ and $z$ is a prefix of $v$.

The third case is a substring that straddles the boundary. Finite automata that search for a pattern have to
remember exactly enough about the end of $u$ to catch that case.`,
        },
        {
          type: 'short',
          id: 'indices-slice',
          prompt: md`Let $w = \texttt{theory}$. What is $w[2 .. 4]$?`,
          answers: ['heo'],
          explain: md`$w_2 w_3 w_4 = \texttt{h} \cdot \texttt{e} \cdot \texttt{o}$. Indices start at 1.`,
        },
        {
          type: 'choice',
          id: 'indices-empty-slice',
          prompt: md`With the same $w$, what is $w[4 .. 3]$?`,
          choices: [
            { text: md`\`o\``, explain: md`The slice runs from index 4 *up to* index 3, which is backwards.` },
            { text: md`$\varepsilon$`, correct: true, explain: md`Right. When $j < i$ the slice is empty, and its length is $3 - 4 + 1 = 0$.` },
            { text: 'It is undefined', explain: md`The definition explicitly returns $\varepsilon$ when $j < i$.` },
          ],
        },
        {
          type: 'membership',
          id: 'indices-subsequences',
          prompt: md`Mark each string that is a **subsequence** of \`abcab\`.`,
          strings: [
            { w: 'aab', inL: true },
            { w: 'cba', inL: false },
            { w: 'acb', inL: true },
            { w: '', inL: true },
            { w: 'bb', inL: true },
            { w: 'abcabc', inL: false },
          ],
        },
        {
          type: 'short',
          id: 'indices-proper-suffixes',
          prompt: md`How many proper suffixes does \`llama\` have?`,
          answers: ['5'],
          explain: md`\`lama\`, \`ama\`, \`ma\`, \`a\` and $\varepsilon$. A string of length $n$ has $n$ proper suffixes.`,
        },
        {
          type: 'short',
          id: 'indices-distinct-substrings',
          prompt: md`How many **distinct nonempty** substrings does \`abab\` have?`,
          answers: ['7'],
          explain: md`\`a\`, \`b\`, \`ab\`, \`ba\`, \`aba\`, \`bab\`, \`abab\`. The bound $n(n+1)/2 = 10$ isn't reached because \`a\`, \`b\` and \`ab\` each occur twice.`,
        },
        {
          type: 'choice',
          id: 'indices-straddle',
          prompt: md`\`101\` is a substring of \`0110\` · \`1001\` = \`01101001\`. Which case of the theorem applies?`,
          choices: [
            { text: md`It is a substring of \`0110\``, explain: md`\`0110\` contains \`11\` but no \`101\`.` },
            { text: md`It is a substring of \`1001\``, explain: md`\`1001\` contains \`00\` but no \`101\`.` },
            {
              text: md`It straddles the boundary: \`10\` is a suffix of \`0110\` and \`1\` is a prefix of \`1001\``,
              correct: true,
              explain: md`Right. Neither piece contains \`101\` alone; it only appears across the join.`,
            },
          ],
        },
      ],
    },
    {
      id: 'recursive-functions',
      title: 'Recursive functions on strings',
      blocks: [
        {
          type: 'text',
          md: md`Length, concatenation and reversal follow one recipe: say what happens to $\varepsilon$, then say what happens
to $a \cdot x$ in terms of the answer for $x$. Any function defined this way is guaranteed to give an answer for
every string, because each recursive call is on a shorter string. You can define all kinds of functions with this
recipe.`,
        },
        {
          type: 'callout',
          kind: 'definition',
          title: 'Symbol count',
          md: md`For a symbol $a$, the number of times $a$ appears in $w$ is

$$\#(a, w) = \begin{cases} 0 & \text{if } w = \varepsilon \\ 1 + \#(a, x) & \text{if } w = a \cdot x \\ \#(a, x) & \text{if } w = b \cdot x \text{ with } b \ne a \end{cases}$$`,
        },
        {
          type: 'text',
          md: md`A function can also build a new string. The **stutter** of a string doubles every symbol:

$$\mathit{st}(w) = \begin{cases} \varepsilon & \text{if } w = \varepsilon \\ a \cdot a \cdot \mathit{st}(x) & \text{if } w = a \cdot x \end{cases}$$

To evaluate a recursive function by hand, unfold one call at a time:

$$\mathit{st}(\texttt{01}) = \texttt{0} \cdot \texttt{0} \cdot \mathit{st}(\texttt{1}) = \texttt{00} \cdot \texttt{1} \cdot \texttt{1} \cdot \mathit{st}(\varepsilon) = \texttt{0011}.$$`,
        },
        {
          type: 'callout',
          kind: 'theorem',
          title: 'Stutter doubles length',
          md: md`For every string $w$, $|\mathit{st}(w)| = 2|w|$.

*Proof.* Assume the claim for every string shorter than $w$.

- If $w = \varepsilon$: $|\mathit{st}(\varepsilon)| = |\varepsilon| = 0 = 2 \cdot 0$.
- If $w = a \cdot x$: $|\mathit{st}(w)| = |a \cdot a \cdot \mathit{st}(x)| = 2 + |\mathit{st}(x)| = 2 + 2|x| = 2|w|$,
  by the inductive hypothesis for $x$. $\blacksquare$`,
        },
        {
          type: 'callout',
          kind: 'note',
          md: md`Recursion and induction are two views of the same structure. A recursive definition has one case per shape
of string, and a proof about that function has the same cases in the same order. When you get stuck in a proof,
look at the definition you are reasoning about: its cases usually tell you how to split the proof.`,
        },
        {
          type: 'text',
          md: md`Functions can take more than one string. This recursive test decides whether $w$ is a prefix of $z$ by
comparing first symbols:

$$\mathit{isPrefix}(w, z) = \begin{cases} \text{True} & \text{if } w = \varepsilon \\ \text{False} & \text{if } w = a \cdot x \text{ and } z = \varepsilon \\ (a = b) \wedge \mathit{isPrefix}(x, y) & \text{if } w = a \cdot x \text{ and } z = b \cdot y \end{cases}$$

Every comparison it makes moves one symbol further into both strings, which is exactly what a finite automaton
will do in Chapter 3.`,
        },
        {
          type: 'short',
          id: 'recursive-stutter',
          prompt: md`What is $\mathit{st}(\texttt{aba})$?`,
          answers: ['aabbaa'],
          explain: md`Each symbol is doubled in place: \`aa\` · \`bb\` · \`aa\`.`,
        },
        {
          type: 'short',
          id: 'recursive-count',
          prompt: md`What is $\#(\texttt{1}, \texttt{10110})$?`,
          answers: ['3'],
          explain: md`The recursion adds 1 for each \`1\` it peels off and 0 for each \`0\`.`,
        },
        {
          type: 'choice',
          id: 'recursive-mystery',
          prompt: md`Define $f(\varepsilon) = \varepsilon$, and for $w = a \cdot x$ let $f(w) = f(x)$ if $a = \texttt{0}$ and $f(w) = a \cdot f(x)$ otherwise. What does $f$ compute?`,
          choices: [
            { text: 'It reverses the string', explain: md`Symbols are kept in their original order; $a$ stays in front of $f(x)$.` },
            { text: md`It deletes every \`0\``, correct: true, explain: md`Right. A \`0\` is skipped; any other symbol is kept.` },
            { text: md`It keeps only the \`0\`s`, explain: md`The case $a = \texttt{0}$ drops the symbol.` },
            { text: md`It doubles every \`1\``, explain: md`Each kept symbol appears once, as $a \cdot f(x)$.` },
          ],
        },
        {
          type: 'short',
          id: 'recursive-mystery-value',
          prompt: md`With the same $f$, what is $f(\texttt{10010})$?`,
          answers: ['11'],
          explain: md`Deleting the three \`0\`s leaves \`11\`.`,
        },
        {
          type: 'choice',
          id: 'recursive-is-prefix',
          prompt: md`How many recursive calls does $\mathit{isPrefix}(\texttt{ab}, \texttt{abba})$ make before returning, not counting the first call?`,
          choices: [
            { text: '1', explain: md`After comparing \`a\` with \`a\`, it still has to check \`b\` against \`bba\`.` },
            { text: '2', correct: true, explain: md`Right. It calls $\mathit{isPrefix}(\texttt{b}, \texttt{bba})$, then $\mathit{isPrefix}(\varepsilon, \texttt{ba})$, which returns True.` },
            { text: '4', explain: md`It stops as soon as $w$ runs out, without reading the rest of $z$.` },
          ],
        },
        {
          type: 'callout',
          kind: 'theorem',
          title: 'Counts add up',
          md: md`For every symbol $a$ and all strings $x$ and $y$, $\#(a, x \cdot y) = \#(a, x) + \#(a, y)$.

*Proof sketch.* Induct on $x$. The case $x = \varepsilon$ is immediate. For $x = b \cdot x'$, both sides gain
$1$ if $b = a$ and $0$ otherwise, and the hypothesis handles $x'$. $\blacksquare$

Summing over all symbols gives $|w| = \sum_{a \in \Sigma} \#(a, w)$. Identities like this one are the glue in
almost every later proof about counting.`,
        },
        {
          type: 'text',
          md: md`### A gallery of recursive functions

Each function below is defined by cases on the shape of its input. Evaluate them by unfolding one call at a time,
exactly as with stutter. Several of them come back in later chapters.

- **Complement** swaps bits: $\varepsilon^c = \varepsilon$, $(\texttt{0}x)^c = \texttt{1} \cdot x^c$, $(\texttt{1}x)^c = \texttt{0} \cdot x^c$.
- **Sort** moves every \`0\` before every \`1\`: $\mathit{sort}(\varepsilon) = \varepsilon$, $\mathit{sort}(\texttt{0}x) = \texttt{0} \cdot \mathit{sort}(x)$, $\mathit{sort}(\texttt{1}x) = \mathit{sort}(x) \cdot \texttt{1}$.
- **Swap** exchanges neighbours in pairs: $\mathit{swap}(w) = w$ if $|w| \le 1$, and $\mathit{swap}(abx) = ba \cdot \mathit{swap}(x)$.
- **Odds and evens** are *mutually* recursive and pick out alternate symbols:
  $\mathit{odds}(\varepsilon) = \mathit{evens}(\varepsilon) = \varepsilon$, $\mathit{odds}(ax) = a \cdot \mathit{evens}(x)$, $\mathit{evens}(ax) = \mathit{odds}(x)$.
- **Faro** interleaves two strings, like a perfect riffle shuffle: $\mathit{faro}(\varepsilon, z) = z$ and $\mathit{faro}(ax, z) = a \cdot \mathit{faro}(z, x)$. Notice the arguments trade places.
- **Declutter** collapses runs of a repeated symbol: $\mathit{dc}(w) = w$ if $|w| \le 1$, $\mathit{dc}(aax) = \mathit{dc}(ax)$, and $\mathit{dc}(abx) = a \cdot \mathit{dc}(bx)$ when $a \ne b$.
- **Hanoi** nests copies of itself: $\mathit{hanoi}(\varepsilon) = \varepsilon$ and $\mathit{hanoi}(ax) = \mathit{hanoi}(x) \cdot a \cdot \mathit{hanoi}(x)$.
- **Value** reads a binary string as a number, peeling off the *last* bit: $\mathit{val}(\varepsilon) = 0$, $\mathit{val}(x\texttt{0}) = 2\,\mathit{val}(x)$, $\mathit{val}(x\texttt{1}) = 2\,\mathit{val}(x) + 1$.

Proofs about these functions follow their own cases. Faro, for instance, is proved by induction on $|w| + |z|$,
because its recursive call swaps the arguments, and hanoi satisfies $|\mathit{hanoi}(w)| = 2^{|w|} - 1$.`,
        },
        {
          type: 'short',
          id: 'gallery-complement',
          prompt: md`What is $(\texttt{0010})^c$?`,
          answers: ['1101'],
          explain: md`Every \`0\` becomes \`1\` and every \`1\` becomes \`0\`.`,
        },
        {
          type: 'short',
          id: 'gallery-sort',
          prompt: md`What is $\mathit{sort}(\texttt{10110})$?`,
          answers: ['00111'],
          explain: md`Each \`0\` goes on the front and each \`1\` on the back, giving two \`0\`s then three \`1\`s.`,
        },
        {
          type: 'short',
          id: 'gallery-swap',
          prompt: md`What is $\mathit{swap}(\texttt{10011})$?`,
          answers: ['01101'],
          explain: md`Pairs \`10\` → \`01\` and \`01\` → \`10\`, and the leftover \`1\` stays: \`01\` · \`10\` · \`1\`.`,
        },
        {
          type: 'short',
          id: 'gallery-odds',
          prompt: md`What is $\mathit{odds}(\texttt{abcdefg})$?`,
          answers: ['aceg'],
          explain: md`$\mathit{odds}$ keeps symbols 1, 3, 5, 7; $\mathit{evens}$ would give \`bdf\`.`,
        },
        {
          type: 'short',
          id: 'gallery-faro',
          prompt: md`What is $\mathit{faro}(\texttt{abc}, \texttt{xyz})$?`,
          answers: ['axbycz'],
          explain: md`$\texttt{a} \cdot \mathit{faro}(\texttt{xyz}, \texttt{bc}) = \texttt{ax} \cdot \mathit{faro}(\texttt{bc}, \texttt{yz}) = \cdots = \texttt{axbycz}$.`,
        },
        {
          type: 'short',
          id: 'gallery-declutter',
          prompt: md`What is $\mathit{dc}(\texttt{aabbbaac})$?`,
          answers: ['abac'],
          explain: md`Each run collapses to one symbol: \`aa\`, \`bbb\`, \`aa\`, \`c\` become \`a\`, \`b\`, \`a\`, \`c\`.`,
        },
        {
          type: 'short',
          id: 'gallery-hanoi-length',
          prompt: md`If $|w| = 4$, how long is $\mathit{hanoi}(w)$?`,
          answers: ['15'],
          explain: md`The length doubles and adds one at each level: $0, 1, 3, 7, 15$, which is $2^4 - 1$.`,
        },
        {
          type: 'short',
          id: 'gallery-value',
          prompt: md`What is $\mathit{val}(\texttt{1011})$?`,
          answers: ['11'],
          explain: md`Unfold from the right: $\mathit{val}(\texttt{1}) = 1$, then $2$, then $5$, then $11$.`,
        },
        {
          type: 'choice',
          id: 'gallery-last-symbol',
          prompt: md`The value function splits $w$ into $x \cdot \texttt{0}$ or $x \cdot \texttt{1}$, peeling off the *last* symbol. Is that a legitimate recursive definition?`,
          choices: [
            {
              text: md`Yes: every nonempty binary string ends in exactly one of those ways, and $x$ is shorter than $w$`,
              correct: true,
              explain: md`Right. A recursive definition needs exhaustive cases and recursive calls on shorter strings; which end you peel from doesn't matter.`,
            },
            { text: md`No: strings are built by adding symbols on the left`, explain: md`Proving that every nonempty string is $x \cdot a$ takes a short induction, but once you have it you may recurse on it.` },
            { text: md`Only if $w$ has even length`, explain: md`Length parity plays no role in the cases.` },
          ],
        },
      ],
    },
    {
      id: 'recursive-sets',
      title: 'Recursively defined sets',
      blocks: [
        {
          type: 'text',
          md: md`Strings themselves were defined by a base case and a rule. Sets of strings can be defined the same way. A
**recursive definition** of a set $L$ gives some starting strings, some rules for building new members of $L$ from
old ones, and a final clause saying that *nothing else* is in $L$.

That final clause is what makes induction work. Every string in $L$ was built by a finite sequence of rules, so to
prove that every member of $L$ has some property, you check that the starting strings have it and that each rule
preserves it. This is **structural induction**, and the inductive hypothesis applies to the smaller members the
rule was built from.`,
        },
        {
          type: 'callout',
          kind: 'definition',
          title: 'Balanced binary strings',
          md: md`Let $E$ be the smallest set of strings over $\{0, 1\}$ such that

- $\varepsilon \in E$, and
- if $x, y \in E$, then both $\texttt{0}x\texttt{1}y$ and $\texttt{1}x\texttt{0}y$ are in $E$.`,
        },
        {
          type: 'callout',
          kind: 'theorem',
          title: 'Members of E are balanced',
          md: md`Every $w \in E$ satisfies $\#(\texttt{0}, w) = \#(\texttt{1}, w)$.

*Proof.* Induct on how $w$ was built, assuming the claim for the strings it was built from.

- If $w = \varepsilon$: both counts are $0$.
- If $w = \texttt{0}x\texttt{1}y$ with $x, y \in E$: by the counting identity,
  $\#(\texttt{0}, w) = 1 + \#(\texttt{0}, x) + \#(\texttt{0}, y)$ and $\#(\texttt{1}, w) = 1 + \#(\texttt{1}, x) + \#(\texttt{1}, y)$.
  The hypothesis makes the right-hand sides equal.
- The case $w = \texttt{1}x\texttt{0}y$ is symmetric. $\blacksquare$

The converse is also true, and harder: *every* string with equally many \`0\`s and \`1\`s is in $E$. Proving it means
showing how to split an arbitrary balanced string into the shape $\texttt{0}x\texttt{1}y$ or $\texttt{1}x\texttt{0}y$.
Questions like "does this recursive definition produce exactly the strings I meant?" return in Chapter 5, where
grammars are recursive definitions of exactly this kind.`,
        },
        {
          type: 'text',
          md: md`To show that a particular string *is* in a recursively defined set, exhibit how to build it. For example,
\`10\` $= \texttt{1}\varepsilon\texttt{0}\varepsilon \in E$, and then \`0110\` $= \texttt{0}x\texttt{1}y$ with
$x = \varepsilon$ and $y = \texttt{10}$, so \`0110\` $\in E$. A tempting first attempt, $x = \texttt{1}$, goes nowhere
because \`1\` is not in $E$. Finding the right split is the creative step; checking it is mechanical.

The activities below use a different set. Let $T$ be the smallest set with $\texttt{1} \in T$ and, whenever
$x, y \in T$, also $\texttt{0}xy \in T$. (Read \`0\` as "a node with two children" and \`1\` as "a leaf"; then $T$
lists binary trees, written out in preorder.)`,
        },
        {
          type: 'membership',
          id: 'sets-tree-membership',
          prompt: md`Mark each string that is in $T$.`,
          strings: [
            { w: '1', inL: true },
            { w: '011', inL: true },
            { w: '01011', inL: true },
            { w: '00111', inL: true },
            { w: '0111', inL: false },
            { w: '101', inL: false },
            { w: '0011', inL: false },
            { w: '', inL: false },
          ],
        },
        {
          type: 'choice',
          id: 'sets-tree-invariant',
          prompt: md`Which property holds for every string in $T$?`,
          choices: [
            { text: md`$\#(\texttt{0}, w) = \#(\texttt{1}, w)$`, explain: md`\`1\` is in $T$ and has one \`1\` and no \`0\`s.` },
            {
              text: md`$\#(\texttt{1}, w) = \#(\texttt{0}, w) + 1$`,
              correct: true,
              explain: md`Right. It holds for \`1\`. If $x$ and $y$ each have one more \`1\` than \`0\`, then $xy$ has two more, and the extra \`0\` in $\texttt{0}xy$ brings the gap back to one.`,
            },
            { text: md`Every string in $T$ starts with \`0\``, explain: md`The base string \`1\` doesn't.` },
          ],
        },
        {
          type: 'choice',
          id: 'sets-tree-hypothesis',
          prompt: md`In a structural induction proof about $T$, the case $w = \texttt{0}xy$ may apply the inductive hypothesis to…`,
          choices: [
            { text: md`only $x$`, explain: md`$y$ was also built earlier, so it is covered too.` },
            { text: md`both $x$ and $y$`, correct: true, explain: md`Right. Both are members of $T$ built in fewer steps than $w$.` },
            { text: md`the string $\texttt{0}x$`, explain: md`$\texttt{0}x$ need not be in $T$ at all, so the hypothesis says nothing about it.` },
          ],
        },
        {
          type: 'short',
          id: 'sets-tree-count',
          prompt: md`How many strings of length 5 are in $T$?`,
          answers: ['2'],
          explain: md`\`01011\` and \`00111\`: the two binary trees with three leaves.`,
        },
      ],
    },
    {
      id: 'exercises',
      title: 'Exercises',
      blocks: [
        {
          type: 'text',
          md: md`These problems mix everything in the chapter. Work them on paper first; several of them are quick to
check but take a moment of thought.`,
        },
        {
          type: 'short',
          id: 'exercises-abc-length-2',
          prompt: md`How many strings of length 2 are there over $\Sigma = \{a, b, c\}$?`,
          answers: ['9'],
          explain: md`$|\Sigma^2| = 3^2 = 9$.`,
        },
        {
          type: 'short',
          id: 'exercises-substrings-aaa',
          prompt: md`How many **distinct** substrings does \`aaa\` have, counting $\varepsilon$?`,
          answers: ['4'],
          explain: md`$\varepsilon$, \`a\`, \`aa\` and \`aaa\`. Many positions give the same substring, and we count each string once.`,
        },
        {
          type: 'short',
          id: 'exercises-palindromes-length-4',
          prompt: md`How many binary strings of length 4 are palindromes?`,
          answers: ['4'],
          explain: md`The first two symbols decide the last two (\`0000\`, \`0110\`, \`1001\`, \`1111\`), so there are $2^2 = 4$.`,
        },
        {
          type: 'membership',
          id: 'exercises-balanced-count',
          prompt: md`Over $\Sigma = \{0, 1\}$, mark each string $w$ with $\#(\texttt{0}, w) = \#(\texttt{1}, w)$.`,
          strings: [
            { w: '', inL: true },
            { w: '01', inL: true },
            { w: '0011', inL: true },
            { w: '010', inL: false },
            { w: '1100', inL: true },
            { w: '111', inL: false },
          ],
        },
        {
          type: 'choice',
          id: 'exercises-false-identity',
          prompt: md`Which statement is **false** for some strings $w$ and $z$?`,
          choices: [
            { text: md`$|w^R| = |w|$`, explain: md`Reversal rearranges symbols without adding or removing any.` },
            {
              text: md`$(w \cdot z)^R = w^R \cdot z^R$`,
              correct: true,
              explain: md`Right. With $w = \texttt{a}$ and $z = \texttt{b}$ the left side is \`ba\` but the right side is \`ab\`. The pieces swap order.`,
            },
            { text: md`$w \cdot \varepsilon = w$`, explain: md`This is the right-identity lemma from Section 1.3.` },
            { text: md`$|w \cdot z| = |z \cdot w|$`, explain: md`Both equal $|w| + |z|$, even though the strings themselves can differ.` },
          ],
        },
        {
          type: 'short',
          id: 'exercises-power-reversal',
          prompt: md`Let $w = \texttt{ab}$. What is $(w^3)^R$?`,
          answers: ['bababa'],
          explain: md`$w^3 = \texttt{ababab}$, and reading it backwards gives \`bababa\`, which is also $(w^R)^3$.`,
        },
        {
          type: 'choice',
          id: 'exercises-bad-proof',
          prompt: md`A classmate "proves" that every binary string has the same number of \`0\`s and \`1\`s. Base case: $\varepsilon$ has zero of each. Inductive case: for $w = a \cdot x$, the hypothesis says $x$ is balanced, so $w$ is balanced. What is wrong?`,
          choices: [
            { text: 'The base case is false', explain: md`$\varepsilon$ really does have zero \`0\`s and zero \`1\`s.` },
            {
              text: md`The inductive step never justifies its conclusion: adding one symbol $a$ to a balanced $x$ makes it unbalanced`,
              correct: true,
              explain: md`Right. Every step needs a reason. Here $\#(a, w) = 1 + \#(a, x)$, so the counts differ by one.`,
            },
            { text: 'Induction cannot be used for claims about counting', explain: md`Counting claims are proved by induction all the time, like $|\mathit{st}(w)| = 2|w|$.` },
          ],
        },
        {
          type: 'choice',
          id: 'exercises-cancellation',
          prompt: md`Suppose $x \cdot z = y \cdot z$. What can you conclude?`,
          choices: [
            { text: md`$x = y$`, correct: true, explain: md`Right. Concatenation cancels on either side; this is proved by induction on $x$ (with $y$ arbitrary), directly from the definition.` },
            { text: md`$z = \varepsilon$`, explain: md`\`a\` · \`b\` = \`a\` · \`b\` with $z = \texttt{b}$, so $z$ can be anything.` },
            { text: 'Nothing, without knowing the lengths', explain: md`Equal strings with a common suffix must agree on what comes before it.` },
          ],
        },
        {
          type: 'short',
          id: 'exercises-max-substrings',
          prompt: md`What is the largest possible number of distinct nonempty substrings of a string of length 5?`,
          answers: ['15'],
          explain: md`$5 \cdot 6 / 2 = 15$, reached when no substring repeats, as in \`abcde\`.`,
        },
        {
          type: 'short',
          id: 'exercises-hanoi',
          prompt: md`Evaluate $\mathit{hanoi}(\texttt{ab})$.`,
          answers: ['bab'],
          explain: md`$\mathit{hanoi}(\texttt{b}) = \varepsilon \cdot \texttt{b} \cdot \varepsilon = \texttt{b}$, so $\mathit{hanoi}(\texttt{ab}) = \texttt{b} \cdot \texttt{a} \cdot \texttt{b}$.`,
        },
        {
          type: 'short',
          id: 'exercises-bitrev',
          prompt: md`Define $\mathit{bitrev}(w) = w$ if $|w| \le 1$, and otherwise $\mathit{bitrev}(w) = \mathit{bitrev}(\mathit{odds}(w)) \cdot \mathit{bitrev}(\mathit{evens}(w))$. What is $\mathit{bitrev}(\texttt{abcdefgh})$?`,
          answers: ['aecgbfdh'],
          explain: md`$\mathit{odds}$ gives \`aceg\` and $\mathit{evens}$ gives \`bdfh\`. Recursing, \`aceg\` becomes \`ae\` · \`cg\` and \`bdfh\` becomes \`bf\` · \`dh\`. This is the bit-reversal order used by the fast Fourier transform.`,
        },
        {
          type: 'short',
          id: 'exercises-faro-stutter',
          prompt: md`Evaluate $\mathit{faro}(\texttt{abc}, \texttt{abc})$. Which earlier function gives the same answer?`,
          answers: ['aabbcc'],
          explain: md`Interleaving a string with itself doubles every symbol, so $\mathit{faro}(w, w) = \mathit{st}(w)$. Proving that is a good induction exercise.`,
        },
        {
          type: 'choice',
          id: 'exercises-commuting',
          prompt: md`Suppose $x \cdot y = y \cdot x$ for nonempty strings $x$ and $y$, such as \`abab\` and \`ab\`. What must be true?`,
          choices: [
            { text: md`$x = y$`, explain: md`\`abab\` · \`ab\` = \`ab\` · \`abab\`, yet the strings differ.` },
            {
              text: md`$x = w^m$ and $y = w^n$ for some string $w$ and integers $m, n$`,
              correct: true,
              explain: md`Right. Strings that commute are powers of a common string; here $w = \texttt{ab}$, $m = 2$, $n = 1$.`,
            },
            { text: md`$|x| = |y|$`, explain: md`The example has lengths 4 and 2.` },
          ],
        },
        {
          type: 'membership',
          id: 'exercises-balanced-set',
          prompt: md`Using the set $E$ from Section 1.7, mark each string that is in $E$.`,
          strings: [
            { w: '01', inL: true },
            { w: '1001', inL: true },
            { w: '0101', inL: true },
            { w: '011', inL: false },
            { w: '110', inL: false },
            { w: '', inL: true },
          ],
        },
      ],
    },
  ],
};
