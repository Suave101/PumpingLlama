import type { Chapter } from '../types';
import { md } from '../md';

export const regularLanguages: Chapter = {
  id: 'regular-languages',
  title: 'Regular languages',
  summary: 'Languages as sets of strings, the operations that build them, and regular expressions.',
  keyIdeas: md`- A language is any set of strings. $\varnothing$ and $\{\varepsilon\}$ are different languages.
- Regular languages are built from $\varnothing$, $\{\varepsilon\}$ and single symbols using union, concatenation and star.
- A regular expression names a regular language. Star binds tightest, then concatenation, then union.
- There are countably many regular expressions and uncountably many languages, so most languages are not regular.`,
  sections: [
    {
      id: 'languages',
      title: 'Languages',
      blocks: [
        {
          type: 'text',
          md: md`A **language** is any set of strings over a fixed alphabet, that is, any subset of $\Sigma^*$. Languages can be
finite, like $\{\texttt{0}, \texttt{01}\}$, or infinite, like the set of all binary strings with an odd number of
\`1\`s. Every computational question in this book has the same shape: *given a string $w$, is $w$ in the language $L$?*

Two tiny languages are easy to confuse. The **empty language** $\varnothing$ has no strings at all. The language
$\{\varepsilon\}$ has exactly one string, the empty one.`,
        },
        {
          type: 'callout',
          kind: 'definition',
          title: 'Building languages',
          md: md`For languages $A$ and $B$:

- **Union** $A + B = \{ w \mid w \in A \text{ or } w \in B \}$
- **Concatenation** $A \cdot B = \{ xy \mid x \in A,\ y \in B \}$
- **Kleene star** $A^* = \{\varepsilon\} + A + A \cdot A + A \cdot A \cdot A + \cdots$, every concatenation of zero or more strings from $A$`,
        },
        {
          type: 'choice',
          id: 'languages-concat-empty',
          prompt: md`For any language $L$, what is $L \cdot \varnothing$?`,
          choices: [
            { text: md`$L$`, explain: md`That is $L \cdot \{\varepsilon\}$. Concatenating needs a string from *each* side.` },
            { text: md`$\varnothing$`, correct: true, explain: md`Right. There is no $y \in \varnothing$ to put after $x$, so no strings are produced.` },
            { text: md`$\{\varepsilon\}$`, explain: md`No strings can be formed at all, not even $\varepsilon$.` },
          ],
        },
        {
          type: 'choice',
          id: 'languages-star-empty',
          prompt: md`What is $\varnothing^*$?`,
          choices: [
            { text: md`$\varnothing$`, explain: md`Kleene star always contains the concatenation of zero strings.` },
            { text: md`$\{\varepsilon\}$`, correct: true, explain: md`Right. The only way to concatenate strings from $\varnothing$ is to use zero of them.` },
            { text: md`$\Sigma^*$`, explain: md`That would be $\Sigma^*$ itself, the star of the alphabet.` },
          ],
        },
        {
          type: 'membership',
          id: 'languages-zero-star-one',
          prompt: md`Let $L = \{\texttt{0}\}^* \cdot \{\texttt{1}\}$. Mark each string that is in $L$.`,
          strings: [
            { w: '1', inL: true },
            { w: '0001', inL: true },
            { w: '', inL: false },
            { w: '10', inL: false },
            { w: '011', inL: false },
            { w: '001', inL: true },
          ],
        },
      ],
    },
    {
      id: 'regular-expressions',
      title: 'Regular expressions',
      blocks: [
        {
          type: 'callout',
          kind: 'definition',
          title: 'Regular language',
          md: md`A language is **regular** if it is

- $\varnothing$, or $\{\varepsilon\}$, or $\{a\}$ for a single symbol $a$, or
- $A + B$, $A \cdot B$, or $A^*$ for regular languages $A$ and $B$.`,
        },
        {
          type: 'text',
          md: md`A **regular expression** is a compact name for a regular language that follows the definition directly. In
this book (and in every lab) we write \`+\` or \`|\` for union, juxtaposition for concatenation, \`*\` for star and
\`ε\` for the empty string. Star binds tightest, then concatenation, then union, so \`0+10*\` means
$\{\texttt{0}\} + (\{\texttt{1}\} \cdot \{\texttt{0}\}^*)$.

Some useful patterns over $\{0, 1\}$:

| Expression | Language |
|---|---|
| \`(0+1)*\` | every string |
| \`(0+1)*1(0+1)*\` | strings containing at least one \`1\` |
| \`(0+1)*00\` | strings ending in \`00\` |
| \`0*(10*10*)*\` | strings with an even number of \`1\`s |

Many familiar "regex" features, like backreferences, are not regular expressions in this sense. Some of them can
describe languages that no regular expression can.`,
        },
        {
          type: 'membership',
          id: 'regex-ends-00',
          prompt: md`Which strings match \`(0+1)*00\`?`,
          strings: [
            { w: '00', inL: true },
            { w: '100', inL: true },
            { w: '0', inL: false },
            { w: '001', inL: false },
            { w: '', inL: false },
            { w: '1100', inL: true },
          ],
        },
        {
          type: 'choice',
          id: 'regex-precedence',
          prompt: md`How is \`01*+1\` parsed?`,
          choices: [
            { text: md`$(\texttt{0}\texttt{1})^* + \texttt{1}$`, explain: md`Star applies only to the symbol right before it.` },
            { text: md`$(\texttt{0} \cdot \texttt{1}^*) + \texttt{1}$`, correct: true, explain: md`Right. Star first, then concatenation, then union.` },
            { text: md`$\texttt{0} \cdot (\texttt{1}^* + \texttt{1})$`, explain: md`Union has the lowest precedence, so it splits the whole expression.` },
          ],
        },
        {
          type: 'short',
          id: 'regex-at-least-one-1',
          prompt: md`Write a regular expression over $\{0, 1\}$ for strings that **start** with \`1\`.`,
          answers: ['1(0+1)*', '1(0|1)*', '1(1+0)*', '1(1|0)*'],
          explain: md`A \`1\` followed by anything: \`1(0+1)*\`.`,
        },
      ],
    },
    {
      id: 'not-every-language-is-regular',
      title: 'Not every language is regular',
      blocks: [
        {
          type: 'text',
          md: md`Every regular expression is a finite string over a finite set of symbols, so we can list all regular
expressions in order of length. That makes the regular languages **countable**. The set of all languages over
$\{0, 1\}$ is the set of all subsets of an infinite set, which is **uncountable** by Cantor's diagonal argument. So
almost every language is not regular.

Counting tells us non-regular languages exist, but not *which* ones. To prove that a specific language like
$\{\texttt{0}^n\texttt{1}^n \mid n \ge 0\}$ is not regular we need a model of what regular languages can compute.
That model is the finite-state machine, which comes next.`,
        },
        {
          type: 'choice',
          id: 'nonregular-counting',
          prompt: 'Why must some languages fail to be regular?',
          choices: [
            { text: 'Some languages are infinite', explain: md`Many infinite languages, like $\Sigma^*$, are regular.` },
            {
              text: 'There are countably many regular expressions but uncountably many languages',
              correct: true,
              explain: 'Right. Each regular expression names one language, so most languages have no name at all.',
            },
            { text: 'Regular expressions cannot use the empty string', explain: md`They can: $\varepsilon$ is a regular expression.` },
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
          md: md`Write a regular expression for each language. Use \`+\` or \`|\` for union, \`*\` for star and \`ε\` for
the empty string. The checker compares your expression with the target language on every short string and shows
one where they disagree.

A good habit: before you write anything, list a few short strings that should match and a few that shouldn't,
including $\varepsilon$.`,
        },
        { type: 'lab', id: 'lab-regex-starts-with-1', problem: 'regex-starts-with-1' },
        { type: 'lab', id: 'lab-regex-even-1s', problem: 'regex-even-1s' },
        { type: 'lab', id: 'lab-regex-contains-101', problem: 'regex-contains-101' },
        { type: 'lab', id: 'lab-regex-no-00', problem: 'regex-no-00' },
      ],
    },
  ],
};
