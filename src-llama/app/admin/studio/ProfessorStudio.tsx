'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Problem,
  ProblemType,
  DFA,
  PDA,
  CFG,
  TestCase,
} from '@/types/automata';
import { CanvasEditor } from '@/components/editors/CanvasEditor';
import { PdaCanvasEditor } from '@/components/editors/PdaCanvasEditor';
import { CfgEditor } from '@/components/editors/CfgEditor';
import { RegexEditor } from '@/components/editors/RegexEditor';

const PROBLEM_TYPES: { label: string; value: ProblemType }[] = [
  { label: 'DFA Construction', value: 'dfa-construction' },
  { label: 'NFA Construction', value: 'nfa-construction' },
  { label: 'RegEx Construction', value: 'regex-construction' },
  { label: 'DFA → RegEx', value: 'dfa-to-regex' },
  { label: 'NFA → DFA', value: 'nfa-to-dfa' },
  { label: 'RegEx → DFA', value: 'regex-to-dfa' },
  { label: 'DFA Minimization', value: 'dfa-minimization' },
  { label: 'CFG Construction', value: 'cfg-construction' },
  { label: 'CFG → Greibach Normal Form (GNF)', value: 'cfg-to-gnf' },
  { label: 'CFG → Chomsky Normal Form (CNF)', value: 'cfg-to-cnf' },
  { label: 'PDA Construction', value: 'pda-construction' },
  { label: 'CFG → PDA', value: 'cfg-to-pda' },
  { label: 'Pumping Lemma Proof', value: 'pumping-lemma' },
  { label: 'Ambiguity Detection', value: 'ambiguity-detection' },
  { label: 'Parse Trees', value: 'parse-trees' },
  { label: 'Mega Problem', value: 'mega-problem' },
];

export function ProfessorStudio() {
  // 1. Metadata Form State
  const [id, setId] = useState<string>('dfa-even-zeros-ones');
  const [title, setTitle] = useState<string>('DFA: Even Number of 0s and 1s');
  const [type, setType] = useState<ProblemType>('dfa-construction');
  const [description, setDescription] = useState<string>(
    'Construct a DFA over alphabet {0, 1} that accepts strings containing both an even number of "0"s and an even number of "1"s.'
  );
  const [alphabetInput, setAlphabetInput] = useState<string>('0, 1');
  const [ltiAssignmentId, setLtiAssignmentId] = useState<string>('');

  // 2. Target / Answer Solutions State
  const parsedAlphabet = alphabetInput
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const [answerDfa, setAnswerDfa] = useState<DFA>({
    states: ['q0', 'q1', 'q2', 'q3'],
    alphabet: parsedAlphabet.length > 0 ? parsedAlphabet : ['0', '1'],
    initialState: 'q0',
    acceptStates: ['q0'],
    transitions: {
      q0: { '0': 'q1', '1': 'q2' },
      q1: { '0': 'q0', '1': 'q3' },
      q2: { '0': 'q3', '1': 'q0' },
      q3: { '0': 'q2', '1': 'q1' },
    },
  });

  const [answerPda, setAnswerPda] = useState<PDA>({
    states: ['q0', 'q1', 'q2'],
    alphabet: parsedAlphabet.length > 0 ? parsedAlphabet : ['0', '1'],
    stackAlphabet: ['Z0', '0', '1'],
    initialState: 'q0',
    initialStackSymbol: 'Z0',
    acceptStates: ['q2'],
    acceptBy: 'final-state',
    transitions: [
      { from: 'q0', to: 'q0', inputSymbol: '0', popSymbol: 'Z0', pushSymbols: ['0', 'Z0'] },
      { from: 'q0', to: 'q1', inputSymbol: '1', popSymbol: '0', pushSymbols: [] },
      { from: 'q1', to: 'q2', inputSymbol: '', popSymbol: 'Z0', pushSymbols: ['Z0'] },
    ],
  });

  const [cfgText, setCfgText] = useState<string>('S -> 0 S 0 | 1 S 1 | ε');
  const [targetRegex, setTargetRegex] = useState<string>('(00|11)*');

  // 3. Test Cases Suite State
  const [testCases, setTestCases] = useState<TestCase[]>([
    { input: '', expected: true },
    { input: '00', expected: true },
    { input: '11', expected: true },
    { input: '0101', expected: true },
    { input: '0', expected: false },
    { input: '1', expected: false },
    { input: '01', expected: false },
    { input: '000', expected: false },
  ]);

  const [newTestInput, setNewTestInput] = useState<string>('');
  const [newTestExpected, setNewTestExpected] = useState<boolean>(true);
  const [copiedStatus, setCopiedStatus] = useState<boolean>(false);

  // Parse CFG text string into CFG object format
  const parseCfgText = (): CFG => {
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
      terminals: parsedAlphabet,
      rules,
      startSymbol: rules[0]?.lhs || 'S',
    };
  };

  // Build complete Problem JSON Object
  const buildProblemObject = (): Problem => {
    const problemObj: Problem = {
      id: id.toLowerCase().replace(/\s+/g, '-'),
      type,
      title,
      description,
      alphabet: parsedAlphabet,
      testCases,
    };

    if (ltiAssignmentId.trim()) {
      problemObj.canvasLtiAssignmentId = ltiAssignmentId.trim();
    }

    if (
      ['dfa-construction', 'nfa-construction', 'nfa-to-dfa', 'dfa-minimization', 'regex-to-dfa'].includes(type)
    ) {
      problemObj.answerDFA = answerDfa;
    }

    if (['pda-construction', 'cfg-to-pda'].includes(type)) {
      problemObj.answerPDA = answerPda;
    }

    if (['cfg-construction', 'cfg-to-gnf', 'cfg-to-cnf', 'ambiguity-detection'].includes(type)) {
      problemObj.answerCFG = parseCfgText();
    }

    if (['regex-construction', 'dfa-to-regex'].includes(type)) {
      problemObj.targetRegex = targetRegex;
    }

    return problemObj;
  };

  // Test Case Management
  const addTestCase = (e: React.FormEvent) => {
    e.preventDefault();
    setTestCases([...testCases, { input: newTestInput.trim(), expected: newTestExpected }]);
    setNewTestInput('');
  };

  const removeTestCase = (index: number) => {
    setTestCases(testCases.filter((_, i) => i !== index));
  };

  const toggleTestCaseExpected = (index: number) => {
    setTestCases(
      testCases.map((tc, i) => (i === index ? { ...tc, expected: !tc.expected } : tc))
    );
  };

  // Export File Functions
  const handleDownloadJson = () => {
    const jsonString = JSON.stringify(buildProblemObject(), null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${id || 'problem'}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyJson = () => {
    const jsonString = JSON.stringify(buildProblemObject(), null, 2);
    navigator.clipboard.writeText(jsonString);
    setCopiedStatus(true);
    setTimeout(() => setCopiedStatus(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        {/* Studio Top Navigation Bar */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div>
            <Link href="/" className="text-xs font-semibold text-emerald-400 hover:text-emerald-300">
              &larr; Back to Workspace
            </Link>
            <h1 className="text-3xl font-extrabold text-white mt-1">
              Professor Studio <span className="text-xs font-mono font-normal bg-slate-800 text-emerald-400 px-2 py-0.5 rounded border border-slate-700 ml-2">Question Creator</span>
            </h1>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCopyJson}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
            >
              {copiedStatus ? '✓ Copied to Clipboard!' : 'Copy JSON'}
            </button>
            <button
              onClick={handleDownloadJson}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-lg transition"
            >
              Download JSON File
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Editing Panels */}
          <div className="lg:col-span-7 flex flex-col gap-8">
            {/* Step 1: Metadata Form */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col gap-4">
              <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">
                1. Problem Metadata
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Problem Title:</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white focus:border-emerald-500 focus:outline-none"
                    placeholder="e.g. DFA: Even Zeros"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Problem ID (Slug):</label>
                  <input
                    type="text"
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono focus:border-emerald-500 focus:outline-none"
                    placeholder="e.g. dfa-even-zeros"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Exercise Type:</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as ProblemType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-emerald-400 font-mono focus:border-emerald-500 focus:outline-none"
                  >
                    {PROBLEM_TYPES.map((pt) => (
                      <option key={pt.value} value={pt.value}>
                        {pt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Alphabet Σ (comma-separated):</label>
                  <input
                    type="text"
                    value={alphabetInput}
                    onChange={(e) => setAlphabetInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono focus:border-emerald-500 focus:outline-none"
                    placeholder="0, 1"
                  />
                </div>
              </div>

              <div className="text-xs">
                <label className="text-slate-300 block mb-1 font-semibold">Problem Prompt / Description:</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-300 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="text-xs">
                <label className="text-slate-300 block mb-1 font-semibold">
                  Canvas LTI Assignment ID (Optional):
                </label>
                <input
                  type="text"
                  value={ltiAssignmentId}
                  onChange={(e) => setLtiAssignmentId(e.target.value)}
                  placeholder="e.g. canvas_assignment_98234"
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-400 font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Step 2: Model Answer Canvas & Editors */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">
                  2. Model Solution / Reference Answer
                </h2>
                <span className="text-xs text-slate-500 font-mono uppercase">{type}</span>
              </div>

              {/* DFA Target Editor */}
              {[
                'dfa-construction',
                'nfa-construction',
                'nfa-to-dfa',
                'dfa-minimization',
                'regex-to-dfa',
              ].includes(type) && (
                <CanvasEditor
                  alphabet={parsedAlphabet}
                  dfa={answerDfa}
                  onChange={setAnswerDfa}
                />
              )}

              {/* PDA Target Editor */}
              {['pda-construction', 'cfg-to-pda'].includes(type) && (
                <PdaCanvasEditor pda={answerPda} onChange={setAnswerPda} />
              )}

              {/* CFG Target Editor */}
              {[
                'cfg-construction',
                'cfg-to-gnf',
                'cfg-to-cnf',
                'ambiguity-detection',
              ].includes(type) && <CfgEditor value={cfgText} onChange={setCfgText} />}

              {/* RegEx Target Editor */}
              {['regex-construction', 'dfa-to-regex'].includes(type) && (
                <RegexEditor value={targetRegex} onChange={setTargetRegex} />
              )}
            </div>

            {/* Step 3: Test Cases Builder */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col gap-4">
              <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">
                3. Test Case Suite ({testCases.length} Defined)
              </h2>

              <form onSubmit={addTestCase} className="flex gap-2 text-xs">
                <input
                  type="text"
                  value={newTestInput}
                  onChange={(e) => setNewTestInput(e.target.value)}
                  placeholder="Enter input string (e.g. 0101 or empty string)"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
                <select
                  value={newTestExpected ? 'true' : 'false'}
                  onChange={(e) => setNewTestExpected(e.target.value === 'true')}
                  className="bg-slate-950 border border-slate-800 rounded px-3 text-white font-mono"
                >
                  <option value="true">ACCEPT (True)</option>
                  <option value="false font-mono">REJECT (False)</option>
                </select>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded font-medium transition"
                >
                  + Add Test Case
                </button>
              </form>

              <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                {testCases.map((tc, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center bg-slate-950 border border-slate-800 px-3 py-2 rounded text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-slate-300">
                        {tc.input === '' ? '<ε (empty string)>' : `"${tc.input}"`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleTestCaseExpected(idx)}
                        className={`px-2 py-0.5 rounded font-mono text-[11px] ${
                          tc.expected
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-red-950 text-red-300 border border-red-800'
                        }`}
                      >
                        {tc.expected ? 'ACCEPT' : 'REJECT'}
                      </button>
                      <button
                        onClick={() => removeTestCase(idx)}
                        className="text-red-400 hover:text-red-300 text-xs px-2"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel: JSON Preview */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 sticky top-8">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                  Generated Problem JSON
                </h3>
                <span className="text-xs text-emerald-400 font-mono">
                  {id ? `${id}.json` : 'problem.json'}
                </span>
              </div>
              <textarea
                readOnly
                value={JSON.stringify(buildProblemObject(), null, 2)}
                rows={28}
                className="w-full bg-slate-950 font-mono text-xs p-4 rounded-lg border border-slate-800 text-emerald-300 focus:outline-none select-all"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}