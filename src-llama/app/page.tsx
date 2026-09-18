'use client';

import React, { useState, useRef } from 'react';
import { DFA, Problem } from '@/types/automata';
import { runDFA, findCounterexample, parseRegexToDFA, testRegex, dfaToRegex } from '@/lib/logic';

// --- Canvas Graph Types ---
type CanvasNode = {
  id: string;
  x: number;
  y: number;
  isInitial: boolean;
  isAccepting: boolean;
};

type CanvasEdge = {
  id: string;
  from: string;
  to: string;
  symbols: string;
};

const INITIAL_PROBLEMS: Problem[] = [
  {
    id: 'dfa-ends-01',
    type: 'dfa-design',
    title: 'DFA: Ends with "01"',
    description: 'Construct a DFA over alphabet {0, 1} that accepts strings ending in "01".',
    alphabet: ['0', '1'],
    answerDFA: {
      states: ['q0', 'q1', 'q2'],
      alphabet: ['0', '1'],
      initialState: 'q0',
      acceptStates: ['q2'],
      transitions: {
        q0: { '0': 'q1', '1': 'q0' },
        q1: { '0': 'q1', '1': 'q2' },
        q2: { '0': 'q1', '1': 'q0' },
      },
    },
    testCases: [
      { input: '01', expected: true },
      { input: '101', expected: true },
      { input: '100', expected: false },
      { input: '0', expected: false },
      { input: '', expected: false },
    ],
  },
  {
    id: 'dfa-to-regex-even-zeros',
    type: 'dfa-to-regex',
    title: 'DFA to Regex: Even number of 0s',
    description: 'Convert the following DFA into an equivalent Regular Expression.',
    alphabet: ['0', '1'],
    answerDFA: {
      states: ['q0', 'q1'],
      alphabet: ['0', '1'],
      initialState: 'q0',
      acceptStates: ['q0'],
      transitions: {
        q0: { '0': 'q1', '1': 'q0' },
        q1: { '0': 'q0', '1': 'q1' },
      },
    },
    testCases: [
      { input: '', expected: true },
      { input: '11', expected: true },
      { input: '00', expected: true },
      { input: '010', expected: true },
      { input: '0', expected: false },
      { input: '101', expected: false },
    ],
  },
  {
    id: 'regex-to-dfa-1-star-0',
    type: 'regex-to-dfa',
    title: 'Regex to DFA: (1*)0',
    description: 'Build a DFA that matches the Regular Expression: (1*)0',
    targetRegex: '(1*)0',
    alphabet: ['0', '1'],
    answerDFA: {
      states: ['q0', 'q1', 'q2'],
      alphabet: ['0', '1'],
      initialState: 'q0',
      acceptStates: ['q1'],
      transitions: {
        q0: { '1': 'q0', '0': 'q1' },
        q1: { '1': 'q2', '0': 'q2' },
        q2: { '1': 'q2', '0': 'q2' },
      },
    },
    testCases: [
      { input: '0', expected: true },
      { input: '10', expected: true },
      { input: '1110', expected: true },
      { input: '1', expected: false },
      { input: '00', expected: false },
      { input: '', expected: false },
    ],
  },
];

const INITIAL_NODES: CanvasNode[] = [
  { id: 'q0', x: 100, y: 150, isInitial: true, isAccepting: false },
  { id: 'q1', x: 260, y: 150, isInitial: false, isAccepting: false },
  { id: 'q2', x: 420, y: 150, isInitial: false, isAccepting: true },
];

const INITIAL_EDGES: CanvasEdge[] = [
  { id: 'e1', from: 'q0', to: 'q1', symbols: '0' },
  { id: 'e2', from: 'q0', to: 'q0', symbols: '1' },
  { id: 'e3', from: 'q1', to: 'q1', symbols: '0' },
  { id: 'e4', from: 'q1', to: 'q2', symbols: '1' },
  { id: 'e5', from: 'q2', to: 'q1', symbols: '0' },
  { id: 'e6', from: 'q2', to: 'q0', symbols: '1' },
];

type TestResult = {
  input: string;
  expected: boolean;
  actual: boolean;
  passed: boolean;
};

export default function Home() {
  const [problems, setProblems] = useState<Problem[]>(INITIAL_PROBLEMS);
  const [activeProblem, setActiveProblem] = useState<Problem>(INITIAL_PROBLEMS[0]);
  const [editorMode, setEditorMode] = useState<'canvas' | 'json'>('canvas');

  // Canvas State
  const [nodes, setNodes] = useState<CanvasNode[]>(INITIAL_NODES);
  const [edges, setEdges] = useState<CanvasEdge[]>(INITIAL_EDGES);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [edgeSourceId, setEdgeSourceId] = useState<string | null>(null);
  const [tool, setTool] = useState<'select' | 'addNode' | 'addEdge'>('select');
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);

  // Fallback JSON State
  const [dfaJson, setDfaJson] = useState<string>(JSON.stringify(INITIAL_PROBLEMS[0].answerDFA, null, 2));
  const [regexInput, setRegexInput] = useState<string>('');

  // Results State
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [counterexample, setCounterexample] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Convert Canvas Graph -> DFA object
  const graphToDFA = (): DFA => {
    const states = nodes.map((n) => n.id);
    const initialNode = nodes.find((n) => n.isInitial) || nodes[0];
    const acceptStates = nodes.filter((n) => n.isAccepting).map((n) => n.id);
    const transitions: Record<string, Record<string, string>> = {};

    states.forEach((s) => { transitions[s] = {}; });

    edges.forEach((e) => {
      const symList = e.symbols.split(/[\s,]+/).filter(Boolean);
      symList.forEach((sym) => {
        if (transitions[e.from]) {
          transitions[e.from][sym] = e.to;
        }
      });
    });

    return {
      states,
      alphabet: activeProblem.alphabet,
      initialState: initialNode ? initialNode.id : '',
      acceptStates,
      transitions,
    };
  };

  const handleProblemChange = (problem: Problem) => {
    setActiveProblem(problem);
    setTestResults([]);
    setCounterexample(null);
    setErrorMessage(null);
    setRegexInput('');
    setDfaJson(JSON.stringify(problem.answerDFA, null, 2));
  };

  // Schema Validation
  const validateProblem = (item: any): item is Problem => {
    return (
      typeof item === 'object' &&
      item !== null &&
      typeof item.id === 'string' &&
      ['dfa-design', 'dfa-to-regex', 'regex-to-dfa'].includes(item.type) &&
      typeof item.title === 'string' &&
      Array.isArray(item.alphabet) &&
      item.answerDFA &&
      Array.isArray(item.testCases)
    );
  };

  // File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const importedList = Array.isArray(parsed) ? parsed : [parsed];
        const validProblems = importedList.filter(validateProblem);

        if (validProblems.length === 0) {
          setErrorMessage('No valid problem definitions found in the JSON file.');
          return;
        }

        setProblems((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const newProblems = validProblems.filter((p) => !existingIds.has(p.id));
          return [...prev, ...newProblems];
        });

        handleProblemChange(validProblems[0]);
      } catch (err) {
        setErrorMessage('Failed to parse JSON file. Check for syntax errors.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // --- Canvas Interaction Handlers ---
  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (tool === 'addNode' && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const newId = `q${nodes.length}`;
      
      setNodes([
        ...nodes,
        {
          id: newId,
          x,
          y,
          isInitial: nodes.length === 0,
          isAccepting: false,
        },
      ]);
      setTool('select');
    }
  };

  const handleNodeClick = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tool === 'addEdge') {
      if (!edgeSourceId) {
        setEdgeSourceId(nodeId);
      } else {
        const symbol = prompt('Enter transition symbol(s) (e.g. 0 or 0,1):', '0');
        if (symbol) {
          const newEdge: CanvasEdge = {
            id: `e_${Date.now()}`,
            from: edgeSourceId,
            to: nodeId,
            symbols: symbol,
          };
          setEdges([...edges, newEdge]);
        }
        setEdgeSourceId(null);
        setTool('select');
      }
    } else {
      setSelectedNodeId(nodeId);
    }
  };

  const handleMouseDown = (nodeId: string) => {
    if (tool === 'select') setDraggingNodeId(nodeId);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingNodeId && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setNodes(nodes.map((n) => (n.id === draggingNodeId ? { ...n, x, y } : n)));
    }
  };

  const handleMouseUp = () => {
    setDraggingNodeId(null);
  };

  const toggleInitial = (id: string) => {
    setNodes(nodes.map((n) => ({ ...n, isInitial: n.id === id })));
  };

  const toggleAccepting = (id: string) => {
    setNodes(nodes.map((n) => (n.id === id ? { ...n, isAccepting: !n.isAccepting } : n)));
  };

  const deleteNode = (id: string) => {
    setNodes(nodes.filter((n) => n.id !== id));
    setEdges(edges.filter((e) => e.from !== id && e.to !== id));
    if (selectedNodeId === id) setSelectedNodeId(null);
  };

  // --- Run / Grade Solution ---
  const handleRun = () => {
    setErrorMessage(null);
    setCounterexample(null);

    let studentDFA: DFA;

    try {
      if (activeProblem.type === 'dfa-to-regex') {
        if (!regexInput.trim()) {
          setErrorMessage('Please enter a regular expression.');
          return;
        }
        studentDFA = parseRegexToDFA(regexInput, activeProblem.alphabet);
      } else if (editorMode === 'canvas') {
        studentDFA = graphToDFA();
      } else {
        studentDFA = JSON.parse(dfaJson);
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Error processing input.');
      return;
    }

    const results: TestResult[] = activeProblem.testCases.map((tc) => {
      const actual = runDFA(studentDFA, tc.input);
      return {
        input: tc.input === '' ? 'ε (empty string)' : tc.input,
        expected: tc.expected,
        actual,
        passed: actual === tc.expected,
      };
    });
    setTestResults(results);

    const mismatch = findCounterexample(studentDFA, activeProblem.answerDFA);
    setCounterexample(mismatch);
  };

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Problem & Editor */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 overflow-x-auto gap-2">
            <div className="flex gap-2">
              {problems.map((prob) => (
                <button
                  key={prob.id}
                  onClick={() => handleProblemChange(prob)}
                  className={`px-3 py-1.5 rounded text-xs font-semibold whitespace-nowrap transition ${
                    activeProblem.id === prob.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {prob.title}
                </button>
              ))}
            </div>

            <div>
              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 rounded text-xs font-semibold whitespace-nowrap transition"
              >
                + Import JSON
              </button>
            </div>
          </div>

          <header>
            <span className="text-xs uppercase tracking-widest text-emerald-400 font-semibold">
              Category: {activeProblem.type}
            </span>
            <h1 className="text-3xl font-bold text-white mt-1">{activeProblem.title}</h1>
            <p className="text-slate-400 mt-2">{activeProblem.description}</p>
          </header>

          {/* Mode Switcher for DFA Problems */}
          {activeProblem.type !== 'dfa-to-regex' && (
            <div className="flex justify-between items-center bg-slate-950 p-2 rounded-lg border border-slate-800">
              <span className="text-xs text-slate-400 pl-2">Editor Mode:</span>
              <div className="flex gap-1">
                <button
                  onClick={() => setEditorMode('canvas')}
                  className={`px-3 py-1 rounded text-xs font-medium ${
                    editorMode === 'canvas' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Visual Canvas
                </button>
                <button
                  onClick={() => setEditorMode('json')}
                  className={`px-3 py-1 rounded text-xs font-medium ${
                    editorMode === 'json' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  JSON Matrix
                </button>
              </div>
            </div>
          )}

          {/* Interactive Visual Canvas Editor */}
          {activeProblem.type !== 'dfa-to-regex' && editorMode === 'canvas' && (
            <div className="flex flex-col gap-3">
              {/* Toolbar */}
              <div className="flex gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800 text-xs">
                <button
                  onClick={() => setTool('select')}
                  className={`px-3 py-1.5 rounded font-medium ${
                    tool === 'select' ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30' : 'text-slate-400'
                  }`}
                >
                  Move / Select
                </button>
                <button
                  onClick={() => setTool('addNode')}
                  className={`px-3 py-1.5 rounded font-medium ${
                    tool === 'addNode' ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30' : 'text-slate-400'
                  }`}
                >
                  + Add State
                </button>
                <button
                  onClick={() => { setTool('addEdge'); setEdgeSourceId(null); }}
                  className={`px-3 py-1.5 rounded font-medium ${
                    tool === 'addEdge' ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30' : 'text-slate-400'
                  }`}
                >
                  + Add Transition {edgeSourceId ? '(Select Target)' : ''}
                </button>
              </div>

              {/* SVG Canvas Area */}
              <div className="relative border border-slate-800 bg-slate-950 rounded-xl overflow-hidden h-[340px]">
                <svg
                  ref={svgRef}
                  className="w-full h-full cursor-crosshair"
                  onClick={handleCanvasClick}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                >
                  <defs>
                    <marker
                      id="arrow"
                      viewBox="0 0 10 10"
                      refX="28"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
                    </marker>
                  </defs>

                  {/* Render Edges */}
                  {edges.map((e) => {
                    const fromNode = nodes.find((n) => n.id === e.from);
                    const toNode = nodes.find((n) => n.id === e.to);
                    if (!fromNode || !toNode) return null;

                    const isSelfLoop = e.from === e.to;

                    if (isSelfLoop) {
                      return (
                        <g key={e.id}>
                          <path
                            d={`M ${fromNode.x - 12} ${fromNode.y - 22} C ${fromNode.x - 35} ${fromNode.y - 65}, ${fromNode.x + 35} ${fromNode.y - 65}, ${fromNode.x + 12} ${fromNode.y - 22}`}
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="2"
                            markerEnd="url(#arrow)"
                          />
                          <text
                            x={fromNode.x}
                            y={fromNode.y - 52}
                            fill="#a7f3d0"
                            fontSize="12"
                            textAnchor="middle"
                            className="font-mono font-bold select-none"
                          >
                            {e.symbols}
                          </text>
                        </g>
                      );
                    }

                    const angle = Math.atan2(toNode.y - fromNode.y, toNode.x - fromNode.x);
                    const midX = (fromNode.x + toNode.x) / 2;
                    const midY = (fromNode.y + toNode.y) / 2;

                    return (
                      <g key={e.id}>
                        <line
                          x1={fromNode.x}
                          y1={fromNode.y}
                          x2={toNode.x}
                          y2={toNode.y}
                          stroke="#10b981"
                          strokeWidth="2"
                          markerEnd="url(#arrow)"
                        />
                        <text
                          x={midX}
                          y={midY - 8}
                          fill="#a7f3d0"
                          fontSize="12"
                          textAnchor="middle"
                          className="font-mono font-bold select-none"
                        >
                          {e.symbols}
                        </text>
                      </g>
                    );
                  })}

                  {/* Render Nodes */}
                  {nodes.map((n) => {
                    const isSelected = selectedNodeId === n.id;
                    return (
                      <g
                        key={n.id}
                        onClick={(e) => handleNodeClick(n.id, e)}
                        onMouseDown={() => handleMouseDown(n.id)}
                        className="cursor-pointer"
                      >
                        {/* Initial state arrow */}
                        {n.isInitial && (
                          <line
                            x1={n.x - 50}
                            y1={n.y}
                            x2={n.x - 24}
                            y2={n.y}
                            stroke="#38bdf8"
                            strokeWidth="2"
                            markerEnd="url(#arrow)"
                          />
                        )}

                        {/* Outer Circle */}
                        <circle
                          cx={n.x}
                          cy={n.y}
                          r={24}
                          className={`${
                            isSelected
                              ? 'stroke-amber-400 stroke-[3]'
                              : 'stroke-emerald-500 stroke-2'
                          } fill-slate-900`}
                        />

                        {/* Accepting State Inner Circle */}
                        {n.isAccepting && (
                          <circle
                            cx={n.x}
                            cy={n.y}
                            r={18}
                            className="stroke-emerald-500 stroke-2 fill-none"
                          />
                        )}

                        {/* Node Label */}
                        <text
                          x={n.x}
                          y={n.y + 4}
                          fill="#ffffff"
                          fontSize="13"
                          textAnchor="middle"
                          className="font-mono font-bold select-none"
                        >
                          {n.id}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Selected Node Inspector */}
              {selectedNodeId && (
                <div className="flex items-center justify-between bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
                  <span className="font-mono text-emerald-400">Selected State: {selectedNodeId}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleInitial(selectedNodeId)}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                    >
                      Toggle Initial
                    </button>
                    <button
                      onClick={() => toggleAccepting(selectedNodeId)}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                    >
                      Toggle Accepting
                    </button>
                    <button
                      onClick={() => deleteNode(selectedNodeId)}
                      className="px-2 py-1 bg-red-950 hover:bg-red-900 text-red-300 rounded"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* JSON Fallback Textarea */}
          {activeProblem.type !== 'dfa-to-regex' && editorMode === 'json' && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-300">Define DFA (JSON)</label>
              <textarea
                value={dfaJson}
                onChange={(e) => setDfaJson(e.target.value)}
                rows={10}
                className="w-full bg-slate-950 font-mono text-sm p-4 rounded-lg border border-slate-800 text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
          )}

          {/* Regex Input for DFA-to-Regex Problems */}
          {activeProblem.type === 'dfa-to-regex' && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-300">Enter Regular Expression</label>
              <input
                type="text"
                value={regexInput}
                onChange={(e) => setRegexInput(e.target.value)}
                placeholder="e.g. (1*0)* or (0|1)*01"
                className="w-full bg-slate-950 font-mono text-sm p-3 rounded-lg border border-slate-800 text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
          )}

          {errorMessage && (
            <div className="bg-red-950/50 border border-red-500/50 text-red-300 p-3 rounded-md text-sm">
              {errorMessage}
            </div>
          )}

          <button
            onClick={handleRun}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-lg transition duration-150 shadow-lg shadow-emerald-950"
          >
            Run Tests & Verify
          </button>
        </div>

        {/* Right Column: Verification & Test Results Panel */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Verification Results</h2>

            {testResults.length === 0 ? (
              <p className="text-slate-500 text-sm italic">Run tests to evaluate state machine correctness.</p>
            ) : (
              <div className="space-y-4">
                {counterexample === null ? (
                  <div className="bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 p-4 rounded-lg text-sm">
                    <strong>Status: 100% Equivalent</strong>
                    <p className="text-xs text-emerald-400/80 mt-1">
                      Your constructed machine matches the formal language target.
                    </p>
                  </div>
                ) : (
                  <div className="bg-amber-950/60 border border-amber-500/50 text-amber-300 p-4 rounded-lg text-sm">
                    <strong>Equivalence Check Failed</strong>
                    <p className="text-xs text-amber-400/80 mt-1">
                      Failed counterexample string: <code className="bg-slate-900 px-1 py-0.5 rounded text-amber-200">{counterexample}</code>
                    </p>
                  </div>
                )}

                <h3 className="text-sm font-medium text-slate-400 pt-2">Test Suite Results</h3>
                <div className="flex flex-wrap gap-2">
                  {testResults.map((res, idx) => (
                    <div
                      key={idx}
                      className={`px-3 py-2 rounded border text-xs flex flex-col gap-1 min-w-[110px] ${
                        res.passed
                          ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300'
                          : 'bg-red-950/30 border-red-800/50 text-red-300'
                      }`}
                    >
                      <span className="font-mono font-semibold">{res.input}</span>
                      <span className="text-[10px] opacity-75">
                        Exp: {res.expected.toString()} | Got: {res.actual.toString()}
                      </span>
                    </div>
                  ))}
                </div>

                {activeProblem.type === 'dfa-design' && (
                  <div className="border-t border-slate-800 pt-3 mt-4">
                    <span className="text-[11px] text-slate-500 block">Converted Solution Regex (State Elimination):</span>
                    <code className="text-xs font-mono text-slate-400">{dfaToRegex(activeProblem.answerDFA)}</code>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </main>
  );
}