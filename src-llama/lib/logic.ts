import {
  DFA,
  NFA,
  CFG,
  PDA,
  ParseTreeNode,
  AmbiguityProof,
  PumpingLemmaSubmission,
  Problem,
  VerificationResult,
  GrammarSpec,
  BlockLanguage,
} from '@/types/automata';

// ---------------------------------------------------------------------------
// 1. PDA Simulation Engine (Nondeterministic BFS with Epsilon transitions)
// ---------------------------------------------------------------------------
export function runPDA(pda: PDA, input: string): boolean {
  const cleanInput = input === 'ε' || input === 'e' ? '' : input;
  type Configuration = {
    state: string;
    inputIdx: number;
    stack: string[];
  };

  const initialStack = pda.initialStackSymbol ? [pda.initialStackSymbol] : [];
  const queue: Configuration[] = [
    { state: pda.initialState, inputIdx: 0, stack: initialStack },
  ];

  const visited = new Set<string>();
  let steps = 0;
  const maxSteps = 10000;

  while (queue.length > 0 && steps < maxSteps) {
    steps++;
    const { state, inputIdx, stack } = queue.shift()!;
    const stackKey = stack.join(',');
    const visitKey = `${state}:${inputIdx}:${stackKey}`;

    if (visited.has(visitKey)) continue;
    visited.add(visitKey);

    // Acceptance Check
    if (pda.acceptBy === 'empty-stack') {
      if (inputIdx === cleanInput.length && stack.length === 0) return true;
    } else {
      if (inputIdx === cleanInput.length && (pda.acceptStates || []).includes(state)) return true;
    }

    const currentSymbol = inputIdx < cleanInput.length ? cleanInput[inputIdx] : null;

    for (const tr of pda.transitions || []) {
      if (tr.from !== state) continue;

      // Check input matching (exact symbol or epsilon)
      const consumesInput = tr.inputSymbol !== '' && tr.inputSymbol !== 'ε';
      if (consumesInput && tr.inputSymbol !== currentSymbol) continue;

      // Check stack pop matching (exact top symbol or epsilon)
      const topStack = stack[stack.length - 1];
      const requiresPop = tr.popSymbol !== '' && tr.popSymbol !== 'ε';
      if (requiresPop && topStack !== tr.popSymbol) continue;

      // Compute new stack
      const nextStack = [...stack];
      if (requiresPop) {
        nextStack.pop();
      }
      if (tr.pushSymbols && tr.pushSymbols.length > 0) {
        for (let i = tr.pushSymbols.length - 1; i >= 0; i--) {
          const sym = tr.pushSymbols[i];
          if (sym !== '' && sym !== 'ε') {
            nextStack.push(sym);
          }
        }
      }

      queue.push({
        state: tr.to,
        inputIdx: consumesInput ? inputIdx + 1 : inputIdx,
        stack: nextStack,
      });
    }
  }

  return false;
}

// ---------------------------------------------------------------------------
// 2. Normal Forms Verification (CNF & GNF Rules Validation)
// ---------------------------------------------------------------------------
export function checkChomskyNormalForm(cfg: CFG): { valid: boolean; reason?: string } {
  const startOnRhs = cfg.rules.some((r) => r.rhs.some((p) => normalizeForm(p).includes(cfg.startSymbol)));

  for (const rule of cfg.rules) {
    for (const prod of rule.rhs) {
      if (normalizeForm(prod) === '') {
        if (rule.lhs !== cfg.startSymbol) {
          return { valid: false, reason: `ε-production found in non-start variable: ${rule.lhs} -> ε` };
        }
        if (startOnRhs) {
          return { valid: false, reason: `${rule.lhs} -> ε is only allowed when ${rule.lhs} never appears on a right-hand side.` };
        }
        continue;
      }

      const symbols = normalizeForm(prod).split('');

      // Single terminal rule: A -> a
      if (symbols.length === 1 && cfg.terminals.includes(symbols[0])) {
        continue;
      }

      // Two variable rule: A -> BC
      if (symbols.length === 2 && symbols.every((s) => cfg.variables.includes(s))) {
        continue;
      }

      return {
        valid: false,
        reason: `Production '${rule.lhs} -> ${prod}' violates CNF (must be A -> BC or A -> a).`,
      };
    }
  }
  return { valid: true };
}

export function checkGreibachNormalForm(cfg: CFG): { valid: boolean; reason?: string } {
  for (const rule of cfg.rules) {
    for (const prod of rule.rhs) {
      if (normalizeForm(prod) === '') {
        if (rule.lhs !== cfg.startSymbol) {
          return { valid: false, reason: `ε-production found in non-start variable: ${rule.lhs} -> ε` };
        }
        continue;
      }

      const symbols = normalizeForm(prod).split('');
      const firstSym = symbols[0];
      const restSyms = symbols.slice(1);

      if (!cfg.terminals.includes(firstSym)) {
        return {
          valid: false,
          reason: `Production '${rule.lhs} -> ${prod}' does not start with a terminal symbol.`,
        };
      }

      if (!restSyms.every((s) => cfg.variables.includes(s))) {
        return {
          valid: false,
          reason: `Symbols following '${firstSym}' in '${rule.lhs} -> ${prod}' must all be non-terminals.`,
        };
      }
    }
  }
  return { valid: true };
}

// ---------------------------------------------------------------------------
// 3. Ambiguity & Parse Tree Verifiers
// ---------------------------------------------------------------------------
// Strips whitespace and ε markers so "A B", "AB" and "ε" compare as sentential forms
function normalizeForm(s: string): string {
  return s.replace(/\s+/g, '').replace(/ε/g, '');
}

function productionsOf(cfg: CFG, variable: string): string[] {
  return cfg.rules.filter((r) => r.lhs === variable).flatMap((r) => r.rhs.map(normalizeForm));
}

function checkLeftmostDerivation(derivation: string[], cfg: CFG, label: string): string | null {
  const steps = derivation.map(normalizeForm);
  if (steps[0] !== cfg.startSymbol) {
    return `${label} must begin with the start symbol '${cfg.startSymbol}'.`;
  }
  for (let k = 0; k < steps.length - 1; k++) {
    const from = steps[k];
    const to = steps[k + 1];
    const idx = from.split('').findIndex((s) => cfg.variables.includes(s));
    if (idx === -1) {
      return `${label}: '${from}' has no variable left to expand.`;
    }
    const prefix = from.slice(0, idx);
    const suffix = from.slice(idx + 1);
    const ok = productionsOf(cfg, from[idx]).some((p) => prefix + p + suffix === to);
    if (!ok) {
      return `${label}, step ${k + 1}: '${from}' ⇒ '${to}' is not a leftmost derivation step (expand the leftmost '${from[idx]}').`;
    }
  }
  return null;
}

export function verifyAmbiguityProof(proof: AmbiguityProof, cfg: CFG): { valid: boolean; reason: string } {
  const w = normalizeForm(proof.stringW || '');
  if (!w) return { valid: false, reason: 'Target string w cannot be empty.' };

  const d1 = (proof.leftDerivation1 || []).filter((s) => s.trim().length > 0);
  const d2 = (proof.leftDerivation2 || []).filter((s) => s.trim().length > 0);

  if (d1.length < 2 || d2.length < 2) {
    return { valid: false, reason: 'Each derivation needs at least two steps.' };
  }

  if (d1.map(normalizeForm).join('=>') === d2.map(normalizeForm).join('=>')) {
    return { valid: false, reason: 'The two provided derivations are identical.' };
  }

  if (normalizeForm(d1[d1.length - 1]) !== w || normalizeForm(d2[d2.length - 1]) !== w) {
    return { valid: false, reason: `Derivations do not both end in the string "${w}".` };
  }

  const err = checkLeftmostDerivation(d1, cfg, 'Derivation #1') ?? checkLeftmostDerivation(d2, cfg, 'Derivation #2');
  if (err) return { valid: false, reason: err };

  return { valid: true, reason: `Valid proof! String "${w}" has 2 distinct leftmost derivations.` };
}

export function verifyParseTree(tree: ParseTreeNode, cfg: CFG, targetString: string): { valid: boolean; reason: string } {
  if (tree.symbol !== cfg.startSymbol) {
    return { valid: false, reason: `Root of parse tree must be start symbol '${cfg.startSymbol}'.` };
  }

  const checkNode = (node: ParseTreeNode): string | null => {
    if (!node.symbol.trim()) {
      return 'Every node needs a symbol (double-click a node to edit it).';
    }
    if (!node.children || node.children.length === 0) {
      if (cfg.variables.includes(node.symbol)) {
        return `Leaf '${node.symbol}' is a variable; every leaf must be a terminal or ε.`;
      }
      return null;
    }
    if (!cfg.variables.includes(node.symbol)) {
      return `'${node.symbol}' is a terminal, so it cannot have children.`;
    }
    const childForm = normalizeForm(node.children.map((c) => c.symbol).join(''));
    if (!productionsOf(cfg, node.symbol).includes(childForm)) {
      return `No production ${node.symbol} -> ${childForm || 'ε'} exists in the grammar.`;
    }
    for (const child of node.children) {
      const err = checkNode(child);
      if (err) return err;
    }
    return null;
  };

  const structureError = checkNode(tree);
  if (structureError) return { valid: false, reason: structureError };

  const getYield = (node: ParseTreeNode): string => {
    if (!node.children || node.children.length === 0) {
      return node.symbol === 'ε' ? '' : node.symbol;
    }
    return node.children.map(getYield).join('');
  };

  const treeYield = getYield(tree);
  if (treeYield !== targetString) {
    return { valid: false, reason: `Parse tree yield "${treeYield}" does not match target string "${targetString}".` };
  }

  return { valid: true, reason: `Parse tree correctly derives string "${targetString}".` };
}

// ---------------------------------------------------------------------------
// 4. Pumping Lemma (CFL) — the student picks w in terms of p, the checker plays
//    the adversary and tries every split w = uvxyz with |vxy| ≤ p and |vy| ≥ 1
// ---------------------------------------------------------------------------
export function inBlockLanguage(lang: BlockLanguage, s: string): boolean {
  let pos = 0;
  const counts: Record<string, number> = {};
  for (const block of lang.blocks) {
    let len = 0;
    while (s[pos] === block.symbol) {
      pos++;
      len++;
    }
    if (block.count in counts && counts[block.count] !== len) return false;
    counts[block.count] = len;
  }
  if (pos !== s.length) return false;
  return Object.entries(lang.min || {}).every(([v, m]) => (counts[v] ?? 0) >= m);
}

type Exponent = { coef: number; constant: number };
type TemplateItem = { atom: string | TemplateItem[]; exp: Exponent };

// Parses strings such as "a^p b^{2p+1} (ab)^3 c" into a template over p
export function parseStringTemplate(template: string, alphabet: string[]): TemplateItem[] {
  const src = template.replace(/\s+/g, '');
  let pos = 0;

  const parseExponent = (): Exponent => {
    const braced = src[pos] === '{';
    if (braced) pos++;
    const match = /^(\d*)(p?)(?:([+-])(\d+))?/.exec(src.slice(pos));
    if (!match || match[0] === '') throw new Error(`Expected an exponent after '^' at position ${pos}.`);
    pos += match[0].length;
    if (braced) {
      if (src[pos] !== '}') throw new Error("Missing '}' in exponent.");
      pos++;
    }
    const hasP = match[2] === 'p';
    const lead = match[1] === '' ? (hasP ? 1 : 0) : Number(match[1]);
    const tail = match[4] ? Number(match[4]) * (match[3] === '-' ? -1 : 1) : 0;
    return hasP ? { coef: lead, constant: tail } : { coef: 0, constant: lead + tail };
  };

  const parseSeq = (): TemplateItem[] => {
    const items: TemplateItem[] = [];
    while (pos < src.length && src[pos] !== ')') {
      let atom: string | TemplateItem[];
      if (src[pos] === '(') {
        pos++;
        atom = parseSeq();
        if (src[pos] !== ')') throw new Error("Missing ')'.");
        pos++;
      } else if (alphabet.includes(src[pos])) {
        atom = src[pos++];
      } else {
        throw new Error(`'${src[pos]}' is not in the alphabet {${alphabet.join(', ')}}.`);
      }
      let exp: Exponent = { coef: 0, constant: 1 };
      if (src[pos] === '^') {
        pos++;
        exp = parseExponent();
      }
      items.push({ atom, exp });
    }
    return items;
  };

  const items = parseSeq();
  if (pos !== src.length) throw new Error("Unexpected ')'.");
  return items;
}

export function expandTemplate(items: TemplateItem[], p: number): string {
  return items
    .map(({ atom, exp }) => {
      const n = exp.coef * p + exp.constant;
      if (n < 0) throw new Error(`An exponent is negative when p = ${p}.`);
      return (typeof atom === 'string' ? atom : expandTemplate(atom, p)).repeat(n);
    })
    .join('');
}

const PUMPING_LENGTHS = [1, 2, 3, 4, 5, 6, 7];
const PUMP_EXPONENTS = [0, 2, 3];

export function verifyPumpingLemma(
  proof: PumpingLemmaSubmission,
  inLanguage: (s: string) => boolean,
  alphabet: string[]
): { valid: boolean; reason: string } {
  if (!proof.w.trim()) return { valid: false, reason: 'Enter a string w written in terms of p.' };

  let template: TemplateItem[];
  try {
    template = parseStringTemplate(proof.w, alphabet);
  } catch (e) {
    return { valid: false, reason: e instanceof Error ? e.message : String(e) };
  }

  for (const p of PUMPING_LENGTHS) {
    let w: string;
    try {
      w = expandTemplate(template, p);
    } catch (e) {
      return { valid: false, reason: e instanceof Error ? e.message : String(e) };
    }
    if (w.length < p) {
      return { valid: false, reason: `For p = ${p}, w = "${w}" is shorter than p. w must grow with p.` };
    }
    if (!inLanguage(w)) {
      return { valid: false, reason: `For p = ${p}, w = "${w}" is not in L.` };
    }

    // Adversary: look for a split that stays in L for every tested i
    for (let start = 0; start < w.length; start++) {
      for (let vxyLen = 1; vxyLen <= Math.min(p, w.length - start); vxyLen++) {
        for (let vLen = 0; vLen <= vxyLen; vLen++) {
          for (let yLen = 0; vLen + yLen <= vxyLen; yLen++) {
            if (vLen + yLen === 0) continue;
            const u = w.slice(0, start);
            const v = w.slice(start, start + vLen);
            const x = w.slice(start + vLen, start + vxyLen - yLen);
            const y = w.slice(start + vxyLen - yLen, start + vxyLen);
            const z = w.slice(start + vxyLen);
            const escapes = PUMP_EXPONENTS.some((i) => !inLanguage(u + v.repeat(i) + x + y.repeat(i) + z));
            if (!escapes) {
              const show = (s: string) => (s === '' ? 'ε' : s);
              return {
                valid: false,
                reason: `For p = ${p}, w = "${w}": the adversary splits u="${show(u)}", v="${show(v)}", x="${show(x)}", y="${show(y)}", z="${show(z)}", and uvⁱxyⁱz stays in L for i = ${PUMP_EXPONENTS.join(', ')}.`,
              };
            }
          }
        }
      }
    }
  }

  return {
    valid: true,
    reason: `Proof checked for p = ${PUMPING_LENGTHS[0]}…${PUMPING_LENGTHS[PUMPING_LENGTHS.length - 1]}: every split of w can be pumped out of L.`,
  };
}

// ---------------------------------------------------------------------------
// 5. Regular expressions (formal syntax: + or | for union, * for star, ε for empty)
// ---------------------------------------------------------------------------
export function compileFormalRegex(regex: string, alphabet: string[]): RegExp {
  const cleaned = regex.replace(/\s+/g, '');
  for (const ch of cleaned) {
    if (!alphabet.includes(ch) && !'()+|*ε'.includes(ch)) {
      throw new Error(`Unexpected symbol '${ch}' in regular expression.`);
    }
  }
  const escape = (ch: string) => ch.replace(/[.?^${}[\]\\/]/g, '\\$&');
  const body = cleaned
    .split('')
    .map((ch) => (ch === '+' ? '|' : ch === 'ε' ? '' : alphabet.includes(ch) ? escape(ch) : ch))
    .join('');
  return new RegExp(`^(?:${body})$`);
}

// Problem files store grammars either as GrammarSpec or directly as a CFG
// (the latter is what the Professor Studio exports)
export function grammarSpecToCFG(spec: GrammarSpec | CFG): CFG {
  if ('rules' in spec) return spec;
  return {
    variables: spec.variables,
    terminals: spec.terminals,
    startSymbol: spec.startVariable,
    rules: Object.entries(spec.productions).map(([lhs, rhs]) => ({ lhs, rhs })),
  };
}

// ---------------------------------------------------------------------------
// Exact DFA equivalence via BFS over the product automaton; returns the shortest
// string on which the two DFAs disagree
// ---------------------------------------------------------------------------
export function findDfaCounterexample(
  d1: DFA,
  d2: DFA
): { equivalent: boolean; counterexample: string | null } {
  const alphabet = Array.from(new Set([...(d1.alphabet || []), ...(d2.alphabet || [])]));
  const DEAD = '\u0000dead';

  type ProductState = { s1: string; s2: string; path: string };
  const startState: ProductState = { s1: d1.initialState || DEAD, s2: d2.initialState || DEAD, path: '' };
  const queue: ProductState[] = [startState];
  const visited = new Set<string>([`${startState.s1},${startState.s2}`]);

  while (queue.length > 0) {
    const { s1, s2, path } = queue.shift()!;
    const isAccept1 = (d1.acceptStates || []).includes(s1);
    const isAccept2 = (d2.acceptStates || []).includes(s2);

    if (isAccept1 !== isAccept2) {
      return { equivalent: false, counterexample: path };
    }

    for (const sym of alphabet) {
      const nextS1 = d1.transitions?.[s1]?.[sym] || DEAD;
      const nextS2 = d2.transitions?.[s2]?.[sym] || DEAD;
      const key = `${nextS1},${nextS2}`;
      if (!visited.has(key)) {
        visited.add(key);
        queue.push({ s1: nextS1, s2: nextS2, path: path + sym });
      }
    }
  }

  return { equivalent: true, counterexample: null };
}

// The language the student's answer must match, taken from the problem definition
export function referenceLanguage(problem: Problem): ((s: string) => boolean) | null {
  if (problem.answerDFA) {
    const dfa = problem.answerDFA;
    return (s) => runDFA(dfa, s);
  }
  const spec = problem.answerCFG ?? problem.givenCFG;
  if (spec) {
    const cfg = grammarSpecToCFG(spec);
    return (s) => runCFG(cfg, s);
  }
  if (problem.language) {
    const lang = problem.language;
    return (s) => inBlockLanguage(lang, s);
  }
  return null;
}

// All strings over the alphabet, shortest first, capped at roughly `budget` strings
function enumerateStrings(alphabet: string[], budget: number): { strings: string[]; maxLength: number } {
  const strings = [''];
  let layer = [''];
  let maxLength = 0;
  while (alphabet.length > 0 && strings.length + layer.length * alphabet.length <= budget) {
    layer = layer.flatMap((s) => alphabet.map((a) => s + a));
    strings.push(...layer);
    maxLength++;
  }
  return { strings, maxLength };
}

// ---------------------------------------------------------------------------
// 6. Universal Evaluator Endpoint
// ---------------------------------------------------------------------------
export function evaluateSolution(
  studentInput: {
    dfa?: DFA;
    nfa?: NFA;
    regex?: string;
    cfg?: CFG;
    pda?: PDA;
    pumping?: PumpingLemmaSubmission;
    ambiguity?: AmbiguityProof;
    parseTree?: { tree: ParseTreeNode; target: string };
  },
  problem: Problem
): VerificationResult {
  const reference = referenceLanguage(problem);
  const proofResult = (res: { valid: boolean; reason: string }): VerificationResult => ({
    passed: res.valid,
    score: res.valid ? 1.0 : 0.0,
    counterexample: null,
    testResults: [],
    feedback: res.reason,
  });

  // A. Pumping Lemma Proof Evaluation
  if (studentInput.pumping) {
    if (!reference) return proofResult({ valid: false, reason: 'This problem does not define its language.' });
    return proofResult(verifyPumpingLemma(studentInput.pumping, reference, problem.alphabet));
  }

  // B. Ambiguity Proof Evaluation
  if (studentInput.ambiguity && studentInput.cfg) {
    return proofResult(verifyAmbiguityProof(studentInput.ambiguity, studentInput.cfg));
  }

  // C. Parse Tree Evaluation
  if (studentInput.parseTree && studentInput.cfg) {
    return proofResult(verifyParseTree(studentInput.parseTree.tree, studentInput.cfg, studentInput.parseTree.target));
  }

  // D. CFG Normal Forms Checks (CNF / GNF)
  if (studentInput.cfg) {
    if (studentInput.cfg.rules.length === 0) {
      return proofResult({ valid: false, reason: 'Enter at least one production rule.' });
    }
    if (problem.type === 'cfg-to-cnf') {
      const cnfCheck = checkChomskyNormalForm(studentInput.cfg);
      if (!cnfCheck.valid) return proofResult({ valid: false, reason: `Chomsky Normal Form Violation: ${cnfCheck.reason}` });
    } else if (problem.type === 'cfg-to-gnf') {
      const gnfCheck = checkGreibachNormalForm(studentInput.cfg);
      if (!gnfCheck.valid) return proofResult({ valid: false, reason: `Greibach Normal Form Violation: ${gnfCheck.reason}` });
    }
  }

  let accepts: (s: string) => boolean;
  if (studentInput.pda) {
    const pda = studentInput.pda;
    accepts = (s) => runPDA(pda, s);
  } else if (studentInput.cfg) {
    const cfg = studentInput.cfg;
    accepts = (s) => runCFG(cfg, s);
  } else if (studentInput.dfa) {
    const dfa = studentInput.dfa;
    accepts = (s) => runDFA(dfa, s);
  } else if (studentInput.nfa) {
    const nfa = studentInput.nfa;
    accepts = (s) => runNFA(nfa, s);
  } else if (studentInput.regex !== undefined) {
    if (!studentInput.regex.trim()) return proofResult({ valid: false, reason: 'Enter a regular expression.' });
    try {
      const regex = compileFormalRegex(studentInput.regex, problem.alphabet);
      accepts = (s) => regex.test(s);
    } catch (e) {
      return proofResult({ valid: false, reason: `Invalid regular expression: ${e instanceof Error ? e.message : String(e)}` });
    }
  } else {
    return proofResult({ valid: false, reason: 'Nothing to check yet.' });
  }

  // E. Test Cases
  const show = (s: string) => (s === '' ? 'ε (empty string)' : s);
  const testResults = problem.testCases.map((tc) => {
    const actual = accepts(tc.input);
    return { input: show(tc.input), expected: tc.expected, actual, passed: actual === tc.expected };
  });
  const totalPassed = testResults.filter((r) => r.passed).length;
  const failedCase = testResults.find((r) => !r.passed);

  if (failedCase) {
    return {
      passed: false,
      score: Number((totalPassed / Math.max(1, testResults.length)).toFixed(2)),
      counterexample: failedCase.input,
      testResults,
      feedback: `Partial Credit: ${totalPassed}/${testResults.length} test cases passed.`,
    };
  }

  // F. Exact equivalence when both the answer and the reference are DFAs
  if (studentInput.dfa && problem.answerDFA) {
    const { equivalent, counterexample } = findDfaCounterexample(studentInput.dfa, problem.answerDFA);
    if (!equivalent && counterexample !== null) {
      const shouldAccept = runDFA(problem.answerDFA, counterexample);
      return {
        passed: false,
        score: 0.9,
        counterexample: show(counterexample),
        testResults,
        feedback: `All test cases pass, but your DFA ${shouldAccept ? 'rejects' : 'accepts'} "${show(counterexample)}", which should be ${shouldAccept ? 'accepted' : 'rejected'}.`,
      };
    }
    return {
      passed: true,
      score: 1.0,
      counterexample: null,
      testResults,
      feedback: 'Full Credit: all test cases pass and your DFA is equivalent to the target language.',
    };
  }

  // G. Exhaustive comparison against the reference language on all short strings
  if (reference) {
    const budget = studentInput.pda ? 300 : 2000;
    const { strings, maxLength } = enumerateStrings(problem.alphabet, budget);
    const mismatch = strings.find((s) => accepts(s) !== reference(s));
    if (mismatch !== undefined) {
      const shouldAccept = reference(mismatch);
      return {
        passed: false,
        score: 0.9,
        counterexample: show(mismatch),
        testResults,
        feedback: `All test cases pass, but your answer ${shouldAccept ? 'rejects' : 'accepts'} "${show(mismatch)}", which should be ${shouldAccept ? 'accepted' : 'rejected'}.`,
      };
    }
    return {
      passed: true,
      score: 1.0,
      counterexample: null,
      testResults,
      feedback: `Full Credit: all test cases pass and your answer matches the target language on every string up to length ${maxLength} (${strings.length} strings).`,
    };
  }

  return {
    passed: true,
    score: 1.0,
    counterexample: null,
    testResults,
    feedback: 'Full Credit: All test cases passed successfully.',
  };
}

// Helper re-exports
export function runDFA(dfa: DFA, input: string): boolean {
  let currentState = dfa.initialState;
  for (const symbol of input) {
    if (!(dfa.alphabet || []).includes(symbol)) return false;
    currentState = dfa.transitions?.[currentState]?.[symbol];
    if (!currentState) return false;
  }
  return (dfa.acceptStates || []).includes(currentState);
}

export function runNFA(nfa: NFA, input: string): boolean {
  let currentStates = new Set([nfa.initialState]);
  for (const sym of input) {
    const nextStates = new Set<string>();
    for (const state of currentStates) {
      const targets = nfa.transitions[state]?.[sym] || [];
      targets.forEach((t) => nextStates.add(t));
    }
    currentStates = nextStates;
  }
  return Array.from(currentStates).some((s) => nfa.acceptStates.includes(s));
}

// General CFG membership (Earley parser with Aycock–Horspool nullable handling),
// so grammars do not need to be in CNF. Symbols are single characters.
export function runCFG(cfg: CFG, input: string): boolean {
  const cleanInput = input === 'ε' || input === 'e' ? '' : input;
  const startSymbol = cfg.startSymbol || 'S';
  const isVar = (s: string) => cfg.variables.includes(s);
  const prods = cfg.rules.flatMap((r) => r.rhs.map((p) => ({ lhs: r.lhs, rhs: normalizeForm(p).split('') })));

  const nullable = new Set<string>();
  let changed = true;
  while (changed) {
    changed = false;
    for (const pr of prods) {
      if (!nullable.has(pr.lhs) && pr.rhs.every((s) => nullable.has(s))) {
        nullable.add(pr.lhs);
        changed = true;
      }
    }
  }

  type Item = { prod: number; dot: number; origin: number };
  const n = cleanInput.length;
  const sets: Item[][] = Array.from({ length: n + 1 }, () => []);
  const seen: Set<string>[] = Array.from({ length: n + 1 }, () => new Set());
  const add = (i: number, item: Item) => {
    const key = `${item.prod}:${item.dot}:${item.origin}`;
    if (!seen[i].has(key)) {
      seen[i].add(key);
      sets[i].push(item);
    }
  };

  prods.forEach((pr, idx) => {
    if (pr.lhs === startSymbol) add(0, { prod: idx, dot: 0, origin: 0 });
  });

  for (let i = 0; i <= n; i++) {
    for (let k = 0; k < sets[i].length; k++) {
      const item = sets[i][k];
      const { rhs, lhs } = prods[item.prod];
      if (item.dot < rhs.length) {
        const sym = rhs[item.dot];
        if (isVar(sym)) {
          prods.forEach((pr, idx) => {
            if (pr.lhs === sym) add(i, { prod: idx, dot: 0, origin: i });
          });
          if (nullable.has(sym)) add(i, { ...item, dot: item.dot + 1 });
        } else if (i < n && cleanInput[i] === sym) {
          add(i + 1, { ...item, dot: item.dot + 1 });
        }
      } else {
        for (const parent of sets[item.origin]) {
          const pr = prods[parent.prod].rhs;
          if (parent.dot < pr.length && pr[parent.dot] === lhs) {
            add(i, { ...parent, dot: parent.dot + 1 });
          }
        }
      }
    }
  }

  return sets[n].some(
    (item) => item.origin === 0 && prods[item.prod].lhs === startSymbol && item.dot === prods[item.prod].rhs.length
  );
}
