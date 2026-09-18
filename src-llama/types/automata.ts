export type ProblemType = 'dfa-design' | 'dfa-to-regex' | 'regex-to-dfa';

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
  transitions: Record<string, Record<string, string[]>>; // Empty string '' represents epsilon
  initialState: string;
  acceptStates: string[];
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
  answerDFA: DFA;
  targetRegex?: string; // Displayed when problem requires Regex -> DFA
  testCases: TestCase[];
};