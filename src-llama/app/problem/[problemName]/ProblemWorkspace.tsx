'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Problem,
  ProblemType,
  PDA,
  CFG,
  PumpingLemmaSubmission,
  AmbiguityProof,
  VerificationResult,
} from '@/types/automata';
import { evaluateSolution } from '@/lib/logic';

type EditorMode = 'canvas' | 'regex' | 'cfg' | 'pda' | 'pumping' | 'ambiguity' | 'parse-tree' | 'json';

function getProblemModeConfig(type: ProblemType): { defaultMode: EditorMode; allowedModes: EditorMode[] } {
  switch (type) {
    case 'pda-construction':
    case 'cfg-to-pda':
      return { defaultMode: 'pda', allowedModes: ['pda', 'json'] };

    case 'cfg-to-gnf':
    case 'cfg-to-cnf':
    case 'cfg-construction':
      return { defaultMode: 'cfg', allowedModes: ['cfg', 'json'] };

    case 'pumping-lemma':
      return { defaultMode: 'pumping', allowedModes: ['pumping'] };

    case 'ambiguity-detection':
      return { defaultMode: 'ambiguity', allowedModes: ['ambiguity', 'cfg'] };

    case 'parse-trees':
      return { defaultMode: 'parse-tree', allowedModes: ['parse-tree', 'cfg'] };

    case 'dfa-to-regex':
    case 'regex-construction':
      return { defaultMode: 'regex', allowedModes: ['regex'] };

    default:
      return { defaultMode: 'canvas', allowedModes: ['canvas', 'json'] };
  }
}

export default function ProblemWorkspace({ problem }: { problem: Problem }) {
  const modeConfig = useMemo(() => getProblemModeConfig(problem.type), [problem.type]);
  const [editorMode, setEditorMode] = useState<EditorMode>(modeConfig.defaultMode);

  useEffect(() => {
    setEditorMode(modeConfig.defaultMode);
  }, [problem.id, modeConfig]);

  // Editor States
  const [cfgText, setCfgText] = useState<string>('S -> A B | a\nA -> a\nB -> b');
  const [pdaJson, setPdaJson] = useState<string>(
    JSON.stringify(
      {
        states: ['q0', 'q1', 'q2'],
        alphabet: ['a', 'b'],
        stackAlphabet: ['Z0', 'A'],
        initialState: 'q0',
        initialStackSymbol: 'Z0',
        acceptStates: ['q2'],
        acceptBy: 'final-state',
        transitions: [
          { from: 'q0', to: 'q0', inputSymbol: 'a', popSymbol: 'Z0', pushSymbols: ['A', 'Z0'] },
          { from: 'q0', to: 'q1', inputSymbol: 'b', popSymbol: 'A', pushSymbols: [] },
          { from: 'q1', to: 'q2', inputSymbol: '', popSymbol: 'Z0', pushSymbols: ['Z0'] },
        ],
      },
      null,
      2
    )
  );

  const [pumpingState, setPumpingState] = useState<PumpingLemmaSubmission>({
    p: 4,
    w: 'aaaabbbb',
    u: 'aa',
    v: 'aa',
    x: '',
    y: 'bb',
    z: 'bb',
    i: 0,
  });

  const [ambiguityState, setAmbiguityState] = useState<AmbiguityProof>({
    stringW: 'a+a*a',
    leftDerivation1: ['E', 'E+E', 'a+E', 'a+E*E', 'a+a*E', 'a+a*a'],
    leftDerivation2: ['E', 'E*E', 'E+E*E', 'a+E*E', 'a+a*E', 'a+a*a'],
  });

  const [parseTreeInput, setParseTreeInput] = useState<string>(
    JSON.stringify({ symbol: 'S', children: [{ symbol: 'a' }, { symbol: 'b' }] }, null, 2)
  );

  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);

  const parseCFGInput = (): CFG => {
    const lines = cfgText.split('\n').filter((l) => l.trim().length > 0);
    const rules = lines.map((line) => {
      const parts = line.split(/->|::=/).map((s) => s.trim());
      const lhs = parts[0] || 'S';
      const rhsPart = parts[1] || '';
      const rhs = rhsPart.split('|').map((s) => s.trim());
      return { lhs, rhs };
    });

    return {
      variables: Array.from(new Set(rules.map((r) => r.lhs))),
      terminals: problem.alphabet || ['a', 'b'],
      rules,
      startSymbol: rules[0]?.lhs || 'S',
    };
  };

  const handleVerify = () => {
    let payload: Parameters<typeof evaluateSolution>[0] = {};

    if (editorMode === 'pda') {
      try {
        payload.pda = JSON.parse(pdaJson) as PDA;
      } catch {
        alert('Invalid PDA JSON structure.');
        return;
      }
    } else if (editorMode === 'cfg') {
      payload.cfg = parseCFGInput();
    } else if (editorMode === 'pumping') {
      payload.pumping = pumpingState;
    } else if (editorMode === 'ambiguity') {
      payload.ambiguity = ambiguityState;
      payload.cfg = parseCFGInput();
    } else if (editorMode === 'parse-tree') {
      try {
        payload.parseTree = {
          tree: JSON.parse(parseTreeInput),
          target: problem.testCases[0]?.input || 'ab',
        };
        payload.cfg = parseCFGInput();
      } catch {
        alert('Invalid Parse Tree JSON.');
        return;
      }
    }

    const dummyDFA = problem.answerDFA || {
      states: [],
      alphabet: problem.alphabet || ['a', 'b'],
      transitions: {},
      initialState: '',
      acceptStates: [],
    };

    const result = evaluateSolution(payload, dummyDFA, problem.testCases, problem.type);
    setVerificationResult(result);
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
            {/* Mode Switcher */}
            {modeConfig.allowedModes.length > 1 && (
              <div className="flex justify-between items-center bg-slate-900 p-2 rounded-lg border border-slate-800">
                <span className="text-xs text-slate-400 pl-2">Editor Mode:</span>
                <div className="flex gap-1">
                  {modeConfig.allowedModes.map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setEditorMode(mode)}
                      className={`px-3 py-1 rounded text-xs font-medium uppercase ${
                        editorMode === mode ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* PDA Editor */}
            {editorMode === 'pda' && (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-300">
                  Pushdown Automaton Definition (JSON format):
                </label>
                <textarea
                  value={pdaJson}
                  onChange={(e) => setPdaJson(e.target.value)}
                  rows={14}
                  className="w-full bg-slate-900 font-mono text-xs p-4 rounded-lg border border-slate-800 text-emerald-300 focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}

            {/* CFG Editor */}
            {editorMode === 'cfg' && (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-300">
                  Grammar Production Rules (e.g. S -&gt; A B | a):
                </label>
                <textarea
                  value={cfgText}
                  onChange={(e) => setCfgText(e.target.value)}
                  rows={10}
                  className="w-full bg-slate-900 font-mono text-sm p-4 rounded-lg border border-slate-800 text-emerald-300 focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}

            {/* Pumping Lemma Form */}
            {editorMode === 'pumping' && (
              <div className="flex flex-col gap-4 bg-slate-900 p-5 rounded-xl border border-slate-800">
                <h3 className="text-sm font-bold text-emerald-400">Pumping Lemma Adversarial Proof (w = u v x y z)</h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Pumping Length (p):</label>
                    <input
                      type="number"
                      value={pumpingState.p}
                      onChange={(e) => setPumpingState({ ...pumpingState, p: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-950 p-2 rounded border border-slate-800 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Target String w (|w| ≥ p):</label>
                    <input
                      type="text"
                      value={pumpingState.w}
                      onChange={(e) => setPumpingState({ ...pumpingState, w: e.target.value })}
                      className="w-full bg-slate-950 p-2 rounded border border-slate-800 text-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-2 text-xs">
                  {['u', 'v', 'x', 'y', 'z'].map((part) => (
                    <div key={part}>
                      <label className="text-slate-400 block mb-1 uppercase font-bold">{part}:</label>
                      <input
                        type="text"
                        value={(pumpingState as any)[part]}
                        onChange={(e) => setPumpingState({ ...pumpingState, [part]: e.target.value })}
                        className="w-full bg-slate-950 p-2 rounded border border-slate-800 text-emerald-300 font-mono"
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="text-slate-400 text-xs block mb-1">Pumping Exponent (i):</label>
                  <input
                    type="number"
                    value={pumpingState.i}
                    onChange={(e) => setPumpingState({ ...pumpingState, i: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-950 p-2 rounded border border-slate-800 text-white font-mono text-xs"
                  />
                </div>
              </div>
            )}

            {/* Ambiguity Proof Form */}
            {editorMode === 'ambiguity' && (
              <div className="flex flex-col gap-4 bg-slate-900 p-5 rounded-xl border border-slate-800 text-xs">
                <h3 className="text-sm font-bold text-emerald-400">Ambiguity Proof (Two Leftmost Derivations)</h3>
                <div>
                  <label className="text-slate-400 block mb-1">Target String w:</label>
                  <input
                    type="text"
                    value={ambiguityState.stringW}
                    onChange={(e) => setAmbiguityState({ ...ambiguityState, stringW: e.target.value })}
                    className="w-full bg-slate-950 p-2 rounded border border-slate-800 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Leftmost Derivation #1 (comma-separated steps):</label>
                  <input
                    type="text"
                    value={ambiguityState.leftDerivation1.join(', ')}
                    onChange={(e) => setAmbiguityState({ ...ambiguityState, leftDerivation1: e.target.value.split(',').map((s) => s.trim()) })}
                    className="w-full bg-slate-950 p-2 rounded border border-slate-800 text-emerald-300 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Leftmost Derivation #2 (comma-separated steps):</label>
                  <input
                    type="text"
                    value={ambiguityState.leftDerivation2.join(', ')}
                    onChange={(e) => setAmbiguityState({ ...ambiguityState, leftDerivation2: e.target.value.split(',').map((s) => s.trim()) })}
                    className="w-full bg-slate-950 p-2 rounded border border-slate-800 text-emerald-300 font-mono"
                  />
                </div>
              </div>
            )}

            {/* Parse Tree Editor */}
            {editorMode === 'parse-tree' && (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-300">
                  Parse Tree Hierarchy (JSON structure):
                </label>
                <textarea
                  value={parseTreeInput}
                  onChange={(e) => setParseTreeInput(e.target.value)}
                  rows={10}
                  className="w-full bg-slate-900 font-mono text-xs p-4 rounded-lg border border-slate-800 text-emerald-300 focus:outline-none focus:border-emerald-500"
                />
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
                          <span className="font-mono">"{res.input}"</span>
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