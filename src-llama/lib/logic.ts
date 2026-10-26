import {
  DFA,
  NFA,
  CFG,
  PDA,
  ParseTreeNode,
  AmbiguityProof,
  PumpingLemmaSubmission,
  TestCase,
  VerificationResult,
} from '@/types/automata';

// ---------------------------------------------------------------------------
// 1. Parse Tree Verifier
// ---------------------------------------------------------------------------
export function verifyParseTree(
  tree: ParseTreeNode,
  cfg: CFG,
  targetString: string
): { valid: boolean; reason: string } {
  if (!tree) return { valid: false, reason: 'Parse tree is missing or empty.' };

  const startSymbol = (cfg.startSymbol || 'S').trim();
  const rootSymbol = (tree.symbol || '').trim();

  // 1. Root symbol check
  if (rootSymbol !== startSymbol) {
    return {
      valid: false,
      reason: `Root of parse tree must be start symbol '${startSymbol}', but got '${rootSymbol}'.`,
    };
  }

  // 2. Validate production rules recursively against grammar (ignoring internal spaces)
  const validateNode = (node: ParseTreeNode): { valid: boolean; reason?: string } => {
    if (!node.children || node.children.length === 0) {
      return { valid: true };
    }

    const lhs = node.symbol.trim();
    // Concatenate child symbols without spaces (e.g. 'A' + 'B' -> 'AB')
    const rhsClean = node.children.map((c) => c.symbol.trim()).join('');

    if (cfg.rules && cfg.rules.length > 0) {
      const ruleExists = cfg.rules.some((r) => {
        if (r.lhs.trim() !== lhs) return false;

        return r.rhs.some((prod) => {
          // Remove all whitespace from production rule (e.g. 'A B' -> 'AB')
          const cleanProd = prod.replace(/\s+/g, '');
          if (cleanProd === 'ε' || cleanProd === 'e' || cleanProd === '') {
            return rhsClean === '' || rhsClean === 'ε' || rhsClean === 'e';
          }
          return cleanProd === rhsClean;
        });
      });

      if (!ruleExists) {
        const displayedRhs = node.children.map((c) => c.symbol.trim()).join(' ');
        return {
          valid: false,
          reason: `Invalid production in parse tree: '${lhs} -> ${displayedRhs}' is not a rule in the grammar.`,
        };
      }
    }

    for (const child of node.children) {
      const childRes = validateNode(child);
      if (!childRes.valid) return childRes;
    }

    return { valid: true };
  };

  const ruleCheck = validateNode(tree);
  if (!ruleCheck.valid) {
    return ruleCheck as { valid: boolean; reason: string };
  }

  // 3. Compute and verify yield string
  const getYield = (node: ParseTreeNode): string => {
    if (!node.children || node.children.length === 0) {
      return node.symbol === 'ε' || node.symbol === 'e' ? '' : node.symbol.trim();
    }
    return node.children.map(getYield).join('');
  };

  const treeYield = getYield(tree);
  if (treeYield !== targetString) {
    return {
      valid: false,
      reason: `Parse tree yield "${treeYield}" does not match target string "${targetString}".`,
    };
  }

  return {
    valid: true,
    reason: `Parse tree successfully derives target string "${targetString}".`,
  };
}

// ---------------------------------------------------------------------------
// 2. Ambiguity Proof Verifier
// ---------------------------------------------------------------------------
export function verifyAmbiguityProof(
  proof: AmbiguityProof,
  cfg: CFG
): { valid: boolean; reason: string } {
  if (!proof.stringW) return { valid: false, reason: 'Target string w cannot be empty.' };

  const d1 = proof.leftDerivation1;
  const d2 = proof.leftDerivation2;

  if (!d1 || d1.length < 2 || !d2 || d2.length < 2) {
    return { valid: false, reason: 'Two distinct derivation sequences are required.' };
  }

  if (d1.join('=>') === d2.join('=>')) {
    return { valid: false, reason: 'The two provided derivations are identical.' };
  }

  const end1 = d1[d1.length - 1];
  const end2 = d2[d2.length - 1];

  if (end1 !== proof.stringW || end2 !== proof.stringW) {
    return { valid: false, reason: `Derivations do not both yield target string "${proof.stringW}".` };
  }

  return { valid: true, reason: `Valid proof! String "${proof.stringW}" has 2 distinct leftmost derivations.` };
}

// ---------------------------------------------------------------------------
// 3. Formal DFA Product Automaton Equivalence
// ---------------------------------------------------------------------------
export function findDfaCounterexample(
  d1: DFA,
  d2: DFA
): { equivalent: boolean; counterexample: string | null } {
  const alphabet = Array.from(new Set([...d1.alphabet, ...d2.alphabet]));

  type ProductState = { s1: string; s2: string; path: string };

  const startState: ProductState = {
    s1: d1.initialState,
    s2: d2.initialState,
    path: '',
  };

  const queue: ProductState[] = [startState];
  const visited = new Set<string>([`${startState.s1},${startState.s2}`]);

  while (queue.length > 0) {
    const { s1, s2, path } = queue.shift()!;

    const isAccept1 = d1.acceptStates.includes(s1);
    const isAccept2 = d2.acceptStates.includes(s2);

    if (isAccept1 !== isAccept2) {
      return {
        equivalent: false,
        counterexample: path === '' ? 'ε (empty string)' : path,
      };
    }

    for (const sym of alphabet) {
      const nextS1 = d1.transitions[s1]?.[sym] || 'DEAD_STATE';
      const nextS2 = d2.transitions[s2]?.[sym] || 'DEAD_STATE';

      const key = `${nextS1},${nextS2}`;
      if (!visited.has(key)) {
        visited.add(key);
        queue.push({ s1: nextS1, s2: nextS2, path: path + sym });
      }
    }
  }

  return { equivalent: true, counterexample: null };
}

// ---------------------------------------------------------------------------
// 4. Universal Solution Evaluator
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
  answerDFA: DFA,
  testCases: TestCase[],
  problemType?: string
): VerificationResult {
  // A. Parse Tree Verification
  if (studentInput.parseTree && studentInput.cfg) {
    const res = verifyParseTree(
      studentInput.parseTree.tree,
      studentInput.cfg,
      studentInput.parseTree.target
    );
    return {
      passed: res.valid,
      score: res.valid ? 1.0 : 0.0,
      counterexample: res.valid ? null : studentInput.parseTree.target,
      testResults: [
        {
          input: studentInput.parseTree.target,
          expected: true,
          actual: res.valid,
          passed: res.valid,
        },
      ],
      feedback: res.reason,
    };
  }

  // B. Ambiguity Proof Verification
  if (studentInput.ambiguity && studentInput.cfg) {
    const res = verifyAmbiguityProof(studentInput.ambiguity, studentInput.cfg);
    return {
      passed: res.valid,
      score: res.valid ? 1.0 : 0.0,
      counterexample: null,
      testResults: [],
      feedback: res.reason,
    };
  }

  // C. Formal DFA Product Automaton Equivalence
  if (studentInput.dfa && answerDFA && answerDFA.states.length > 0) {
    const formalCheck = findDfaCounterexample(studentInput.dfa, answerDFA);
    if (!formalCheck.equivalent) {
      return {
        passed: false,
        score: 0.0,
        counterexample: formalCheck.counterexample,
        testResults: testCases.map((tc) => ({
          input: tc.input,
          expected: tc.expected,
          actual: runDFA(studentInput.dfa!, tc.input),
          passed: runDFA(studentInput.dfa!, tc.input) === tc.expected,
        })),
        feedback: `Formal Equivalence Failed: Counter-example string "${formalCheck.counterexample}" produces conflicting acceptance.`,
      };
    }
  }

  // D. Standard Automata & Grammar Test Case Suite
  const testResults = testCases.map((tc) => {
    let actual = false;

    if (studentInput.dfa) {
      actual = runDFA(studentInput.dfa, tc.input);
    } else if (studentInput.nfa) {
      actual = runNFA(studentInput.nfa, tc.input);
    } else if (studentInput.pda) {
      actual = runPDA(studentInput.pda, tc.input);
    } else if (studentInput.cfg) {
      actual = runCYK(studentInput.cfg, tc.input);
    }

    return {
      input: tc.input === '' ? 'ε (empty string)' : tc.input,
      expected: tc.expected,
      actual,
      passed: actual === tc.expected,
    };
  });

  const totalPassed = testResults.filter((r) => r.passed).length;
  const isEquivalent = totalPassed === testCases.length;
  const score = isEquivalent ? 1.0 : Number((totalPassed / Math.max(1, testCases.length)).toFixed(2));
  const failingCase = testResults.find((r) => !r.passed);

  return {
    passed: isEquivalent,
    score,
    counterexample: failingCase ? failingCase.input : null,
    testResults,
    feedback: isEquivalent
      ? 'Full Credit: Solution verified successfully.'
      : `Partial Credit: Passed ${totalPassed}/${testCases.length} test cases. ${
          failingCase ? `Failed on input "${failingCase.input}".` : ''
        }`,
  };
}

export function runDFA(dfa: DFA, input: string): boolean {
  let currentState = dfa.initialState;
  for (const symbol of input) {
    if (!dfa.alphabet.includes(symbol)) return false;
    currentState = dfa.transitions[currentState]?.[symbol];
    if (!currentState) return false;
  }
  return dfa.acceptStates.includes(currentState);
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

export function runPDA(pda: PDA, input: string): boolean {
  const cleanInput = input === 'ε' || input === 'e' ? '' : input;
  type Config = { state: string; inputIdx: number; stack: string[] };

  const queue: Config[] = [
    { state: pda.initialState, inputIdx: 0, stack: pda.initialStackSymbol ? [pda.initialStackSymbol] : [] },
  ];
  const visited = new Set<string>();
  let steps = 0;

  while (queue.length > 0 && steps < 10000) {
    steps++;
    const { state, inputIdx, stack } = queue.shift()!;
    const key = `${state}:${inputIdx}:${stack.join(',')}`;

    if (visited.has(key)) continue;
    visited.add(key);

    if (pda.acceptBy === 'empty-stack') {
      if (inputIdx === cleanInput.length && stack.length === 0) return true;
    } else {
      if (inputIdx === cleanInput.length && pda.acceptStates.includes(state)) return true;
    }

    const currentSymbol = inputIdx < cleanInput.length ? cleanInput[inputIdx] : null;

    for (const tr of pda.transitions) {
      if (tr.from !== state) continue;

      const consumesInput = tr.inputSymbol !== '' && tr.inputSymbol !== 'ε';
      if (consumesInput && tr.inputSymbol !== currentSymbol) continue;

      const topStack = stack[stack.length - 1];
      const requiresPop = tr.popSymbol !== '' && tr.popSymbol !== 'ε';
      if (requiresPop && topStack !== tr.popSymbol) continue;

      const nextStack = [...stack];
      if (requiresPop) nextStack.pop();

      if (tr.pushSymbols && tr.pushSymbols.length > 0) {
        for (let i = tr.pushSymbols.length - 1; i >= 0; i--) {
          const sym = tr.pushSymbols[i];
          if (sym !== '' && sym !== 'ε') nextStack.push(sym);
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

export function runCYK(cfg: CFG, input: string): boolean {
  const cleanInput = input === 'ε' || input === 'e' ? '' : input;
  const variables = cfg.variables || [];
  const startSymbol = cfg.startSymbol || 'S';

  if (cleanInput === '') {
    return cfg.rules.some((r) => r.lhs === startSymbol && r.rhs.some((p) => p === '' || p === 'ε'));
  }

  const n = cleanInput.length;
  const P: boolean[][][] = Array.from({ length: n + 1 }, () =>
    Array.from({ length: n + 1 }, () => Array(variables.length).fill(false))
  );

  for (let i = 1; i <= n; i++) {
    const char = cleanInput[i - 1];
    cfg.rules.forEach((rule) => {
      if (rule.rhs.includes(char)) {
        const vIdx = variables.indexOf(rule.lhs);
        if (vIdx !== -1) P[1][i][vIdx] = true;
      }
    });
  }

  for (let l = 2; l <= n; l++) {
    for (let s = 1; s <= n - l + 1; s++) {
      for (let p = 1; p <= l - 1; p++) {
        cfg.rules.forEach((rule) => {
          const vA = variables.indexOf(rule.lhs);
          rule.rhs.forEach((prod) => {
            if (prod.length === 2) {
              const vB = variables.indexOf(prod[0]);
              const vC = variables.indexOf(prod[1]);
              if (vB !== -1 && vC !== -1 && P[p][s][vB] && P[l - p][s + p][vC]) {
                P[l][s][vA] = true;
              }
            }
          });
        });
      }
    }
  }

  const startIdx = variables.indexOf(startSymbol);
  return startIdx !== -1 ? P[n][1][startIdx] : false;
}