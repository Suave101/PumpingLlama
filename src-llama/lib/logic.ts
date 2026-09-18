import { DFA, NFA, TestCase } from '@/types/automata';

/**
 * Runs a string input through a DFA and returns true if accepted.
 */
export function runDFA(dfa: DFA, input: string): boolean {
  let currentState = dfa.initialState;

  for (const symbol of input) {
    if (!dfa.alphabet.includes(symbol)) return false;
    currentState = dfa.transitions[currentState]?.[symbol];
    if (!currentState) return false;
  }

  return dfa.acceptStates.includes(currentState);
}

/**
 * Product Automaton BFS Equivalence Check.
 * Returns the shortest counterexample string if DFAs differ, or null if 100% equivalent.
 */
export function findCounterexample(studentDFA: DFA, answerDFA: DFA): string | null {
  const SINK = '__SINK__';

  const combinedAlphabet = Array.from(
    new Set([...(studentDFA.alphabet || []), ...(answerDFA.alphabet || [])])
  );

  const getNextState = (dfa: DFA, current: string, symbol: string): string => {
    if (current === SINK) return SINK;
    return dfa.transitions[current]?.[symbol] ?? SINK;
  };

  const isAccepting = (dfa: DFA, state: string): boolean => {
    if (state === SINK) return false;
    return dfa.acceptStates.includes(state);
  };

  const queue: [string, string, string][] = [
    [studentDFA.initialState, answerDFA.initialState, '']
  ];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const [sState, aState, path] = queue.shift()!;
    const key = `${sState},${aState}`;

    if (visited.has(key)) continue;
    visited.add(key);

    const sAccept = isAccepting(studentDFA, sState);
    const aAccept = isAccepting(answerDFA, aState);

    if (sAccept !== aAccept) {
      return path === '' ? 'ε (empty string)' : path;
    }

    for (const symbol of combinedAlphabet) {
      const nextS = getNextState(studentDFA, sState, symbol);
      const nextA = getNextState(answerDFA, aState, symbol);

      if (!(nextS === SINK && nextA === SINK)) {
        queue.push([nextS, nextA, path + symbol]);
      }
    }
  }

  return null;
}

/**
 * Tests a student's Regular Expression string against a suite of test cases.
 */
export function testRegex(userRegex: string, testCases: TestCase[]): { passed: boolean; results: { input: string; expected: boolean; actual: boolean; passed: boolean }[] } {
  try {
    // Sanitize basic formal language operators (+ to |) for JS RegExp
    const jsRegexPattern = `^(${userRegex.replace(/\+/g, '|')})$`;
    const regex = new RegExp(jsRegexPattern);

    const results = testCases.map((tc) => {
      const actual = regex.test(tc.input);
      return {
        input: tc.input === '' ? 'ε (empty string)' : tc.input,
        expected: tc.expected,
        actual,
        passed: actual === tc.expected,
      };
    });

    const passed = results.every((r) => r.passed);
    return { passed, results };
  } catch (e) {
    throw new Error('Invalid Regular Expression syntax.');
  }
}

/**
 * Converts a DFA to a Regular Expression string using State Elimination.
 */
export function dfaToRegex(dfa: DFA): string {
  const R: Record<string, Record<string, string>> = {};
  const states = [...dfa.states];
  const START = '__START__';
  const ACCEPT = '__ACCEPT__';

  const union = (a?: string, b?: string) => {
    if (!a) return b || '';
    if (!b) return a;
    return `(${a}|${b})`;
  };

  const star = (expr?: string) => {
    if (!expr || expr === 'ε') return '';
    return expr.length === 1 ? `${expr}*` : `(${expr})*`;
  };

  // Initialize transition matrix
  [...states, START, ACCEPT].forEach((s) => { R[s] = {}; });

  // Populate base DFA transitions
  for (const s of states) {
    for (const sym of dfa.alphabet) {
      const target = dfa.transitions[s]?.[sym];
      if (target) {
        R[s][target] = R[s][target] ? union(R[s][target], sym) : sym;
      }
    }
  }

  // Set start and accept state epsilon transitions
  R[START][dfa.initialState] = 'ε';
  for (const acc of dfa.acceptStates) {
    R[acc][ACCEPT] = R[acc][ACCEPT] ? union(R[acc][ACCEPT], 'ε') : 'ε';
  }

  // State elimination
  for (const k of states) {
    for (const i of [START, ...states]) {
      // Use optional chaining so deleted states are skipped cleanly
      if (i === k || !R[i]?.[k]) continue;

      for (const j of [ACCEPT, ...states]) {
        if (j === k || !R[k]?.[j]) continue;

        const R_ik = R[i][k];
        const R_kk = R[k][k] ? star(R[k][k]) : '';
        const R_kj = R[k][j];

        const path = `${R_ik === 'ε' ? '' : R_ik}${R_kk}${R_kj === 'ε' ? '' : R_kj}`;
        R[i][j] = R[i][j] ? union(R[i][j], path) : path;
      }
    }

    // Remove state k from dictionary
    delete R[k];
    Object.keys(R).forEach((s) => {
      if (R[s]) delete R[s][k];
    });
  }

  return R[START]?.[ACCEPT] || '∅';
}

/**
 * Powerset Construction: NFA to DFA.
 */
export function nfaToDFA(nfa: NFA): DFA {
  const dfaAlphabet = nfa.alphabet.filter((sym) => sym !== '');
  
  const getEpsilonClosure = (states: Set<string>): Set<string> => {
    const closure = new Set(states);
    const stack = Array.from(states);
    while (stack.length > 0) {
      const state = stack.pop()!;
      const epsTargets = nfa.transitions[state]?.[''] || [];
      for (const target of epsTargets) {
        if (!closure.has(target)) {
          closure.add(target);
          stack.push(target);
        }
      }
    }
    return closure;
  };

  const initialClosure = getEpsilonClosure(new Set([nfa.initialState]));
  const dfaStateMap = new Map<string, Set<string>>();
  const dfaTransitions: Record<string, Record<string, string>> = {};
  const stateToKey = (set: Set<string>) => Array.from(set).sort().join(',') || 'empty';

  const startKey = stateToKey(initialClosure);
  dfaStateMap.set(startKey, initialClosure);

  const queue = [startKey];
  const acceptStates = new Set<string>();

  while (queue.length > 0) {
    const currentKey = queue.shift()!;
    const currentSet = dfaStateMap.get(currentKey)!;

    if (Array.from(currentSet).some((s) => nfa.acceptStates.includes(s))) {
      acceptStates.add(currentKey);
    }

    dfaTransitions[currentKey] = {};

    for (const sym of dfaAlphabet) {
      const moveSet = new Set<string>();
      for (const state of currentSet) {
        const targets = nfa.transitions[state]?.[sym] || [];
        targets.forEach((t) => moveSet.add(t));
      }

      const nextClosure = getEpsilonClosure(moveSet);
      const nextKey = stateToKey(nextClosure);

      dfaTransitions[currentKey][sym] = nextKey;

      if (!dfaStateMap.has(nextKey)) {
        dfaStateMap.set(nextKey, nextClosure);
        queue.push(nextKey);
      }
    }
  }

  return {
    states: Array.from(dfaStateMap.keys()),
    alphabet: dfaAlphabet,
    transitions: dfaTransitions,
    initialState: startKey,
    acceptStates: Array.from(acceptStates),
  };
}

// Helper: Inserts explicit concatenation dots (e.g. "a(b|c)" -> "a.(b|c)")
function insertConcatOperators(regex: string): string {
  let result = '';
  for (let i = 0; i < regex.length; i++) {
    const c1 = regex[i];
    result += c1;
    if (i + 1 < regex.length) {
      const c2 = regex[i + 1];
      const c1CanEnd = /[a-zA-Z0-9*)]/.test(c1);
      const c2CanStart = /[a-zA-Z0-9(]/.test(c2);
      if (c1CanEnd && c2CanStart) {
        result += '.';
      }
    }
  }
  return result;
}

// Helper: Converts infix regex string to postfix notation via Shunting Yard
function regexToPostfix(regex: string): string {
  const precedence: Record<string, number> = { '*': 3, '.': 2, '|': 1, '+': 1 };
  let postfix = '';
  const stack: string[] = [];
  const formatted = insertConcatOperators(regex.replace(/\+/g, '|'));

  for (let i = 0; i < formatted.length; i++) {
    const char = formatted[i];
    if (/[a-zA-Z0-9]/.test(char)) {
      postfix += char;
    } else if (char === '(') {
      stack.push(char);
    } else if (char === ')') {
      while (stack.length > 0 && stack[stack.length - 1] !== '(') {
        postfix += stack.pop();
      }
      stack.pop();
    } else if (['*', '.', '|'].includes(char)) {
      while (
        stack.length > 0 &&
        stack[stack.length - 1] !== '(' &&
        (precedence[stack[stack.length - 1]] || 0) >= (precedence[char] || 0)
      ) {
        postfix += stack.pop();
      }
      stack.push(char);
    }
  }

  while (stack.length > 0) {
    postfix += stack.pop();
  }

  return postfix;
}

/**
 * Thompson's Construction: Converts a Regular Expression string into an NFA.
 */
export function regexToNFA(regexStr: string, alphabet: string[]): NFA {
  const postfix = regexToPostfix(regexStr);
  let stateCount = 0;
  const nextState = () => `s${stateCount++}`;

  type Fragment = { start: string; accept: string };
  const stack: Fragment[] = [];
  const transitions: Record<string, Record<string, string[]>> = {};
  const allStates = new Set<string>();

  const addTransition = (from: string, sym: string, to: string) => {
    allStates.add(from);
    allStates.add(to);
    if (!transitions[from]) transitions[from] = {};
    if (!transitions[from][sym]) transitions[from][sym] = [];
    transitions[from][sym].push(to);
  };

  for (const char of postfix) {
    if (alphabet.includes(char) || /[a-zA-Z0-9]/.test(char)) {
      const start = nextState();
      const accept = nextState();
      addTransition(start, char, accept);
      stack.push({ start, accept });
    } else if (char === '*') {
      const frag = stack.pop();
      if (!frag) throw new Error('Invalid syntax near *');
      const start = nextState();
      const accept = nextState();

      addTransition(start, '', frag.start);
      addTransition(start, '', accept);
      addTransition(frag.accept, '', frag.start);
      addTransition(frag.accept, '', accept);

      stack.push({ start, accept });
    } else if (char === '.') {
      const frag2 = stack.pop();
      const frag1 = stack.pop();
      if (!frag1 || !frag2) throw new Error('Invalid concatenation operator');

      addTransition(frag1.accept, '', frag2.start);
      stack.push({ start: frag1.start, accept: frag2.accept });
    } else if (char === '|') {
      const frag2 = stack.pop();
      const frag1 = stack.pop();
      if (!frag1 || !frag2) throw new Error('Invalid union operator');

      const start = nextState();
      const accept = nextState();

      addTransition(start, '', frag1.start);
      addTransition(start, '', frag2.start);
      addTransition(frag1.accept, '', accept);
      addTransition(frag2.accept, '', accept);

      stack.push({ start, accept });
    }
  }

  if (stack.length !== 1) {
    throw new Error('Malformed regular expression');
  }

  const finalFrag = stack[0];

  return {
    states: Array.from(allStates),
    alphabet: [...alphabet, ''],
    transitions,
    initialState: finalFrag.start,
    acceptStates: [finalFrag.accept],
  };
}

/**
 * Converts a Regex string directly into a DFA by chaining Thompson's + Powerset Construction.
 */
export function parseRegexToDFA(regexStr: string, alphabet: string[]): DFA {
  const nfa = regexToNFA(regexStr, alphabet);
  return nfaToDFA(nfa);
}