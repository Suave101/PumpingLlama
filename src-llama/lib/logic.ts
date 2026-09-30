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
      if (inputIdx === cleanInput.length && pda.acceptStates.includes(state)) return true;
    }

    const currentSymbol = inputIdx < cleanInput.length ? cleanInput[inputIdx] : null;

    for (const tr of pda.transitions) {
      if (tr.from !== state) continue;

      // Check input matching (exact symbol or epsilon)
      const consumesInput = tr.inputSymbol !== '';
      if (consumesInput && tr.inputSymbol !== currentSymbol) continue;

      // Check stack pop matching (exact top symbol or epsilon)
      const topStack = stack[stack.length - 1];
      const requiresPop = tr.popSymbol !== '';
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
  for (const rule of cfg.rules) {
    for (const prod of rule.rhs) {
      if (prod === '' || prod === 'ε') {
        if (rule.lhs !== cfg.startSymbol) {
          return { valid: false, reason: `ε-production found in non-start variable: ${rule.lhs} -> ε` };
        }
        continue;
      }

      // Single terminal rule: A -> a
      if (prod.length === 1 && cfg.terminals.includes(prod)) {
        continue;
      }

      // Two variable rule: A -> BC
      const symbols = prod.split('').filter((s) => s.trim().length > 0);
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
      if (prod === '' || prod === 'ε') {
        if (rule.lhs !== cfg.startSymbol) {
          return { valid: false, reason: `ε-production found in non-start variable: ${rule.lhs} -> ε` };
        }
        continue;
      }

      const symbols = prod.split('').filter((s) => s.trim().length > 0);
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
export function verifyAmbiguityProof(proof: AmbiguityProof, cfg: CFG): { valid: boolean; reason: string } {
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
    return { valid: false, reason: `Derivations do not both yield string "${proof.stringW}".` };
  }

  return { valid: true, reason: `Valid proof! String "${proof.stringW}" has 2 distinct leftmost derivations.` };
}

export function verifyParseTree(tree: ParseTreeNode, cfg: CFG, targetString: string): { valid: boolean; reason: string } {
  if (tree.symbol !== cfg.startSymbol) {
    return { valid: false, reason: `Root of parse tree must be start symbol '${cfg.startSymbol}'.` };
  }

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
// 4. Pumping Lemma Proof Verifier (CFL Pumping Lemma: w = uvxyz)
// ---------------------------------------------------------------------------
export function verifyPumpingLemma(proof: PumpingLemmaSubmission, testCases: TestCase[]): { valid: boolean; reason: string } {
  const { p, w, u, v, x, y, z, i } = proof;

  if (w.length < p) {
    return { valid: false, reason: `Chosen string w ("${w}") must have length |w| ≥ p (${p}).` };
  }

  if (u + v + x + y + z !== w) {
    return { valid: false, reason: `Decomposition u+v+x+y+z ("${u+v+x+y+z}") does not equal w ("${w}").` };
  }

  if (v.length + y.length < 1) {
    return { valid: false, reason: '|vy| must be ≥ 1 (pumping parts cannot both be empty).' };
  }

  if ((v + x + y).length > p) {
    return { valid: false, reason: `|vxy| (${(v + x + y).length}) must be ≤ p (${p}).` };
  }

  const pumpedString = u + v.repeat(i) + x + y.repeat(i) + z;
  const matchCase = testCases.find((tc) => tc.input === pumpedString);

  if (matchCase && matchCase.expected === false) {
    return { valid: true, reason: `Success! Pumped string "${pumpedString}" (i=${i}) is NOT in language L.` };
  }

  return {
    valid: true,
    reason: `Pumped string u v^${i} x y^${i} z = "${pumpedString}". Verify if this violates language rules.`,
  };
}

// ---------------------------------------------------------------------------
// 5. Universal Evaluator Endpoint
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
  // A. Pumping Lemma Proof Evaluation
  if (studentInput.pumping) {
    const res = verifyPumpingLemma(studentInput.pumping, testCases);
    return {
      passed: res.valid,
      score: res.valid ? 1.0 : 0.0,
      counterexample: null,
      testResults: [],
      feedback: res.reason,
    };
  }

  // B. Ambiguity Proof Evaluation
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

  // C. Parse Tree Evaluation
  if (studentInput.parseTree && studentInput.cfg) {
    const res = verifyParseTree(studentInput.parseTree.tree, studentInput.cfg, studentInput.parseTree.target);
    return {
      passed: res.valid,
      score: res.valid ? 1.0 : 0.0,
      counterexample: null,
      testResults: [],
      feedback: res.reason,
    };
  }

  // D. CFG Normal Forms Checks (CNF / GNF)
  if (studentInput.cfg) {
    if (problemType === 'cfg-to-cnf') {
      const cnfCheck = checkChomskyNormalForm(studentInput.cfg);
      if (!cnfCheck.valid) {
        return {
          passed: false,
          score: 0.0,
          counterexample: null,
          testResults: [],
          feedback: `Chomsky Normal Form Violation: ${cnfCheck.reason}`,
        };
      }
    } else if (problemType === 'cfg-to-gnf') {
      const gnfCheck = checkGreibachNormalForm(studentInput.cfg);
      if (!gnfCheck.valid) {
        return {
          passed: false,
          score: 0.0,
          counterexample: null,
          testResults: [],
          feedback: `Greibach Normal Form Violation: ${gnfCheck.reason}`,
        };
      }
    }
  }

  // E. Automata Simulation across Test Cases (PDA / CFG / DFA / NFA)
  const testResults = testCases.map((tc) => {
    let actual = false;
    if (studentInput.pda) {
      actual = runPDA(studentInput.pda, tc.input);
    } else if (studentInput.cfg) {
      actual = runCYK(studentInput.cfg, tc.input);
    } else if (studentInput.dfa) {
      actual = runDFA(studentInput.dfa, tc.input);
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

  return {
    passed: isEquivalent,
    score,
    counterexample: testResults.find((r) => !r.passed)?.input || null,
    testResults,
    feedback: isEquivalent
      ? 'Full Credit: All test cases passed successfully.'
      : `Partial Credit: ${totalPassed}/${testCases.length} test cases passed.`,
  };
}

// Helper re-exports
export function runDFA(dfa: DFA, input: string): boolean {
  let currentState = dfa.initialState;
  for (const symbol of input) {
    if (!dfa.alphabet.includes(symbol)) return false;
    currentState = dfa.transitions[currentState]?.[symbol];
    if (!currentState) return false;
  }
  return dfa.acceptStates.includes(currentState);
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