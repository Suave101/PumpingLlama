export type ProblemType =
  | 'dfa-construction'
  | 'regex-construction'
  | 'nfa-construction'
  | 'dfa-to-regex'
  | 'nfa-to-dfa'
  | 'regex-to-dfa'
  | 'dfa-minimization'
  | 'cfg-construction'
  | 'cfg-to-gnf'
  | 'cfg-to-cnf'
  | 'pda-construction'
  | 'cfg-to-pda'
  | 'pumping-lemma'
  | 'ambiguity-detection'
  | 'parse-trees'
  | 'mega-problem';

export type DFA = {
  states: string[];
  alphabet: string[];
  transitions: Record<string, Record<string, string>>;
  initialState: string;
  acceptStates: string[];
};

export type NFA = {
  states: string[];
  alphabet: string[];
  transitions: Record<string, Record<string, string[]>>; // '' represents epsilon
  initialState: string;
  acceptStates: string[];
};

export type CFGRule = {
  lhs: string; // e.g., 'S'
  rhs: string[]; // e.g., ['aSb', '']
};

export type CFG = {
  variables: string[];
  terminals: string[];
  rules: CFGRule[];
  startSymbol: string;
};

export type PDATransition = {
  from: string;
  to: string;
  inputSymbol: string;   // '' for epsilon
  popSymbol: string;     // '' for epsilon
  pushSymbols: string[]; // e.g., ['A', 'B'] or []
};

export type PDA = {
  states: string[];
  alphabet: string[];
  stackAlphabet: string[];
  transitions: PDATransition[];
  initialState: string;
  initialStackSymbol: string;
  acceptStates: string[];
  acceptBy: 'final-state' | 'empty-stack';
};

export type ParseTreeNode = {
  symbol: string;
  children?: ParseTreeNode[];
};

export type AmbiguityProof = {
  stringW: string;
  leftDerivation1: string[]; // e.g., ["S", "AB", "aB", "ab"]
  leftDerivation2: string[]; // e.g., ["S", "AC", "aC", "ab"]
};

export type PumpingLemmaSubmission = {
  p: number;
  w: string;
  u: string;
  v: string;
  x: string;
  y: string;
  z: string;
  i: number;
};

export type TestCase = {
  input: string;
  expected: boolean;
};

export type Problem = {
  id: string;
  type: ProblemType;
  title: string;
  description: string;
  alphabet: string[];
  answerDFA?: DFA;
  answerNFA?: NFA;
  answerCFG?: CFG;
  answerPDA?: PDA;
  targetRegex?: string;
  testCases: TestCase[];
  canvasLtiAssignmentId?: string;
};

export type VerificationResult = {
  passed: boolean;
  score: number;
  counterexample: string | null;
  testResults: { input: string; expected: boolean; actual: boolean; passed: boolean }[];
  feedback: string;
};