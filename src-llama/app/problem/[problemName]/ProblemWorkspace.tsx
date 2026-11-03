'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Problem, ProblemType, DFA, PDA, CFG, VerificationResult } from '@/types/automata';
import { evaluateSolution, grammarSpecToCFG } from '@/lib/logic';
import ParseTreeEditor, { EditableNode, makeNode, toParseTree } from './ParseTreeEditor';
import { DFATable, GrammarCard } from './GivenMachines';

type EditorMode = 'dfa' | 'regex' | 'cfg' | 'pda' | 'pumping' | 'ambiguity' | 'parse-tree';

const DFA_FORMAT = `{
  "states": ["q0", "q1"],
  "alphabet": [...],
  "initialState": "q0",
  "acceptStates": [...],
  "transitions": { "q0": { "<symbol>": "<next state>" }, ... }
}`;

const PDA_FORMAT = `{
  "states": [...],
  "alphabet": [...],
  "stackAlphabet": [...],
  "initialState": "q0",
  "initialStackSymbol": "Z",
  "acceptStates": [...],
  "acceptBy": "final-state" | "empty-stack",
  "transitions": [
    { "from": "q0", "to": "q1", "inputSymbol": "<symbol or empty>",
      "popSymbol": "<symbol or empty>", "pushSymbols": [...] }
  ]
}`;

// Types whose problem statement includes a grammar the student works from
const GIVEN_GRAMMAR_TYPES: ProblemType[] = ['ambiguity-detection', 'parse-trees', 'cfg-to-cnf', 'cfg-to-gnf', 'cfg-to-pda'];
// Types whose answerDFA is the input to the exercise rather than the answer
const GIVEN_DFA_TYPES: ProblemType[] = ['dfa-to-regex', 'dfa-minimization'];

function getEditorMode(type: ProblemType): EditorMode {
  switch (type) {
    case 'pda-construction':
    case 'cfg-to-pda':
      return 'pda';
    case 'cfg-to-gnf':
    case 'cfg-to-cnf':
    case 'cfg-construction':
    case 'cfg-design':
      return 'cfg';
    case 'pumping-lemma':
      return 'pumping';
    case 'ambiguity-detection':
      return 'ambiguity';
    case 'parse-trees':
      return 'parse-tree';
    case 'dfa-to-regex':
    case 'regex-construction':
      return 'regex';
    default:
      return 'dfa';
  }
}

const EPSILON_WORDS = ['ε', 'eps', 'epsilon', 'λ', 'lambda'];

function parseCFGText(text: string, alphabet: string[]): CFG {
  const rules = text
    .split('\n')
    .filter((l) => l.trim().length > 0)
    .map((line) => {
      const [lhs = '', rhsPart = ''] = line.split(/->|→|::=/).map((s) => s.trim());
      const rhs = rhsPart.split('|').map((s) => {
        const alt = s.trim();
        return EPSILON_WORDS.includes(alt.toLowerCase()) ? '' : alt;
      });
      return { lhs, rhs };
    });

  // Merge repeated left-hand sides (e.g. two "S -> ..." lines)
  const merged: CFG['rules'] = [];
  for (const r of rules) {
    const existing = merged.find((m) => m.lhs === r.lhs);
    if (existing) existing.rhs.push(...r.rhs);
    else merged.push({ lhs: r.lhs, rhs: [...r.rhs] });
  }

  return {
    variables: merged.map((r) => r.lhs),
    terminals: alphabet,
    rules: merged,
    startSymbol: merged[0]?.lhs || 'S',
  };
}

const errorResult = (feedback: string): VerificationResult => ({
  passed: false,
  score: 0,
  counterexample: null,
  testResults: [],
  feedback,
});

const inputClass =
  'w-full bg-slate-950 p-2 rounded border border-slate-800 text-emerald-300 font-mono focus:outline-none focus:border-emerald-500';
const textareaClass =
  'w-full bg-slate-900 font-mono text-xs p-4 rounded-lg border border-slate-800 text-emerald-300 focus:outline-none focus:border-emerald-500';

function FormatHint({ format }: { format: string }) {
  return (
    <details className="text-xs text-slate-400">
      <summary className="cursor-pointer select-none hover:text-slate-200">Show expected JSON format</summary>
      <pre className="mt-2 p-3 bg-slate-900 border border-slate-800 rounded font-mono text-[11px] text-slate-400 overflow-x-auto">
        {format}
      </pre>
    </details>
  );
}

function DerivationEditor({
  label,
  steps,
  onChange,
}: {
  label: string;
  steps: string[];
  onChange: (steps: string[]) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-slate-400">{label}</span>
      {steps.map((step, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <span className="w-6 text-right text-slate-500 font-mono">{idx === 0 ? '' : '⇒'}</span>
          <input
            type="text"
            value={step}
            onChange={(e) => onChange(steps.map((s, i) => (i === idx ? e.target.value : s)))}
            aria-label={`${label} step ${idx + 1}`}
            className={inputClass}
          />
          <button
            type="button"
            onClick={() => onChange(steps.length > 1 ? steps.filter((_, i) => i !== idx) : [''])}
            aria-label={`Remove step ${idx + 1}`}
            className="px-2 py-1 rounded text-slate-500 hover:text-red-300 hover:bg-slate-800"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...steps, ''])}
        className="self-start ml-8 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
      >
        + Add step
      </button>
    </div>
  );
}

export default function ProblemWorkspace({ problem }: { problem: Problem }) {
  const editorMode = getEditorMode(problem.type);
  const alphabet = useMemo(() => problem.alphabet || [], [problem.alphabet]);

  const givenCFG = useMemo(
    () => (problem.givenCFG ? grammarSpecToCFG(problem.givenCFG) : null),
    [problem.givenCFG]
  );
  const showGivenGrammar = givenCFG && GIVEN_GRAMMAR_TYPES.includes(problem.type);
  const showGivenDFA = problem.answerDFA && GIVEN_DFA_TYPES.includes(problem.type);
  const targetString = problem.testCases.find((tc) => tc.expected)?.input ?? '';

  // Editor States (all start empty)
  const [dfaJson, setDfaJson] = useState('');
  const [regexText, setRegexText] = useState('');
  const [cfgText, setCfgText] = useState('');
  const [pdaJson, setPdaJson] = useState('');
  const [pumpingW, setPumpingW] = useState('');
  const [ambiguityW, setAmbiguityW] = useState('');
  const [derivation1, setDerivation1] = useState<string[]>(['']);
  const [derivation2, setDerivation2] = useState<string[]>(['']);
  const [parseTree, setParseTree] = useState<EditableNode>(() => makeNode(givenCFG?.startSymbol || 'S'));

  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);

  const parseJson = <T,>(text: string, what: string): T | string => {
    if (!text.trim()) return `Enter a ${what} definition first.`;
    try {
      return JSON.parse(text) as T;
    } catch {
      return `Invalid ${what} JSON structure.`;
    }
  };

  const handleVerify = () => {
    const payload: Parameters<typeof evaluateSolution>[0] = {};

    if (editorMode === 'dfa') {
      const dfa = parseJson<DFA>(dfaJson, 'DFA');
      if (typeof dfa === 'string') return setVerificationResult(errorResult(dfa));
      payload.dfa = dfa;
    } else if (editorMode === 'pda') {
      const pda = parseJson<PDA>(pdaJson, 'PDA');
      if (typeof pda === 'string') return setVerificationResult(errorResult(pda));
      payload.pda = pda;
    } else if (editorMode === 'regex') {
      payload.regex = regexText;
    } else if (editorMode === 'cfg') {
      payload.cfg = parseCFGText(cfgText, alphabet);
    } else if (editorMode === 'pumping') {
      payload.pumping = { w: pumpingW };
    } else if (editorMode === 'ambiguity' || editorMode === 'parse-tree') {
      if (!givenCFG) return setVerificationResult(errorResult('This problem does not define its grammar.'));
      payload.cfg = givenCFG;
      if (editorMode === 'ambiguity') {
        payload.ambiguity = { stringW: ambiguityW, leftDerivation1: derivation1, leftDerivation2: derivation2 };
      } else {
        payload.parseTree = { tree: toParseTree(parseTree), target: targetString };
      }
    }

    setVerificationResult(evaluateSolution(payload, problem));
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        <header className="flex justify-between items-start border-b border-slate-800 pb-4">
          <div>
            <Link href="/" className="text-xs font-semibold text-emerald-400 hover:text-emerald-300">
              &larr; Back to Problem Overview
            </Link>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs uppercase tracking-wider font-semibold px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-emerald-400 font-mono">
                {problem.type}
              </span>
              <h1 className="text-2xl font-bold text-white">{problem.title}</h1>
            </div>
            <p className="text-slate-400 text-sm mt-1">{problem.description}</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 flex flex-col gap-6">
            {showGivenGrammar && <GrammarCard cfg={givenCFG} title="Given grammar" />}
            {showGivenDFA && <DFATable dfa={problem.answerDFA!} />}

            {/* DFA Editor */}
            {editorMode === 'dfa' && (
              <div className="flex flex-col gap-2">
                <label htmlFor="dfa-json" className="text-xs font-semibold text-slate-300">
                  Deterministic Finite Automaton Definition (JSON format), Σ = {'{'}{alphabet.join(', ')}{'}'}:
                </label>
                <textarea
                  id="dfa-json"
                  value={dfaJson}
                  onChange={(e) => setDfaJson(e.target.value)}
                  rows={14}
                  spellCheck={false}
                  className={textareaClass}
                />
                <FormatHint format={DFA_FORMAT} />
              </div>
            )}

            {/* Regex Editor */}
            {editorMode === 'regex' && (
              <div className="flex flex-col gap-2">
                <label htmlFor="regex" className="text-xs font-semibold text-slate-300">
                  Regular Expression (use + or | for union, * for star, ε for the empty string):
                </label>
                <input
                  id="regex"
                  type="text"
                  value={regexText}
                  onChange={(e) => setRegexText(e.target.value)}
                  spellCheck={false}
                  className="w-full bg-slate-900 font-mono text-sm p-4 rounded-lg border border-slate-800 text-emerald-300 focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}

            {/* PDA Editor */}
            {editorMode === 'pda' && (
              <div className="flex flex-col gap-2">
                <label htmlFor="pda-json" className="text-xs font-semibold text-slate-300">
                  Pushdown Automaton Definition (JSON format):
                </label>
                <textarea
                  id="pda-json"
                  value={pdaJson}
                  onChange={(e) => setPdaJson(e.target.value)}
                  rows={14}
                  spellCheck={false}
                  className={textareaClass}
                />
                <FormatHint format={PDA_FORMAT} />
              </div>
            )}

            {/* CFG Editor */}
            {editorMode === 'cfg' && (
              <div className="flex flex-col gap-2">
                <label htmlFor="cfg-text" className="text-xs font-semibold text-slate-300">
                  Grammar Production Rules, one variable per line (format: S -&gt; aSb | ε). The first line&apos;s
                  variable is the start symbol.
                </label>
                <textarea
                  id="cfg-text"
                  value={cfgText}
                  onChange={(e) => setCfgText(e.target.value)}
                  rows={10}
                  spellCheck={false}
                  className="w-full bg-slate-900 font-mono text-sm p-4 rounded-lg border border-slate-800 text-emerald-300 focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}

            {/* Pumping Lemma Form */}
            {editorMode === 'pumping' && (
              <div className="flex flex-col gap-4 bg-slate-900 p-5 rounded-xl border border-slate-800 text-xs">
                <h3 className="text-sm font-bold text-emerald-400">Pumping Lemma Proof</h3>
                <ol className="list-decimal list-inside text-slate-400 space-y-1 leading-relaxed">
                  <li>The adversary picks a pumping length p ≥ 1.</li>
                  <li>You pick a string w ∈ L, written in terms of p, with |w| ≥ p.</li>
                  <li>
                    The adversary splits w = uvxyz with |vxy| ≤ p and |vy| ≥ 1. The checker tries every such split.
                  </li>
                  <li>You win if, for every split, some uvⁱxyⁱz is not in L.</li>
                </ol>
                <div>
                  <label htmlFor="pumping-w" className="text-slate-400 block mb-1">
                    Your string w (exponent notation: x^p, x^{'{'}2p+1{'}'}, (xy)^p):
                  </label>
                  <input
                    id="pumping-w"
                    type="text"
                    value={pumpingW}
                    onChange={(e) => setPumpingW(e.target.value)}
                    spellCheck={false}
                    className={`${inputClass} text-sm`}
                  />
                </div>
              </div>
            )}

            {/* Ambiguity Proof Form */}
            {editorMode === 'ambiguity' && (
              <div className="flex flex-col gap-5 bg-slate-900 p-5 rounded-xl border border-slate-800 text-xs">
                <h3 className="text-sm font-bold text-emerald-400">Ambiguity Proof (Two Leftmost Derivations)</h3>
                <div>
                  <label htmlFor="ambiguity-w" className="text-slate-400 block mb-1">
                    Target String w:
                  </label>
                  <input
                    id="ambiguity-w"
                    type="text"
                    value={ambiguityW}
                    onChange={(e) => setAmbiguityW(e.target.value)}
                    spellCheck={false}
                    className={inputClass}
                  />
                </div>
                <p className="text-slate-500">
                  Write one sentential form per step, starting with the start symbol. Each step must replace the
                  leftmost variable using one production.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DerivationEditor label="Leftmost Derivation #1" steps={derivation1} onChange={setDerivation1} />
                  <DerivationEditor label="Leftmost Derivation #2" steps={derivation2} onChange={setDerivation2} />
                </div>
              </div>
            )}

            {/* Parse Tree Editor */}
            {editorMode === 'parse-tree' && (
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-slate-300">
                  Parse tree for <span className="font-mono text-emerald-300">&quot;{targetString}&quot;</span>:
                </span>
                <ParseTreeEditor root={parseTree} onChange={setParseTree} />
              </div>
            )}

            <button
              onClick={handleVerify}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-lg transition shadow-lg"
            >
              Verify Solution & Run Evaluator
            </button>
          </div>

          {/* Results Feedback Panel */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-3">Verification & Score</h2>
              {!verificationResult ? (
                <p className="text-slate-500 text-sm italic">Execute solution to view automated grading diagnostics.</p>
              ) : (
                <div className="space-y-4">
                  <div
                    className={`p-4 rounded-lg text-sm border ${
                      verificationResult.passed
                        ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                        : 'bg-amber-950/60 border-amber-500/50 text-amber-300'
                    }`}
                  >
                    <div className="font-bold flex justify-between items-center">
                      <span>{verificationResult.passed ? '✓ Solution Verified' : '✗ Verification Failed'}</span>
                      <span className="text-xs bg-slate-950 px-2 py-0.5 rounded border border-slate-800 font-mono">
                        Score: {(verificationResult.score * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-xs mt-2 leading-relaxed">{verificationResult.feedback}</p>
                  </div>

                  {verificationResult.testResults.length > 0 && (
                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                      <span className="text-xs text-slate-400">Test Case Diagnostics:</span>
                      {verificationResult.testResults.map((res, idx) => (
                        <div
                          key={idx}
                          className={`px-3 py-2 rounded border text-xs flex justify-between items-center ${
                            res.passed
                              ? 'bg-emerald-950/30 border-emerald-900/50 text-emerald-300'
                              : 'bg-red-950/30 border-red-900/50 text-red-300'
                          }`}
                        >
                          <span className="font-mono">&quot;{res.input}&quot;</span>
                          <span>{res.passed ? '✓ Passed' : '✗ Failed'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
