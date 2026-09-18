'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { DFA, Problem } from '@/types/automata';
import { runDFA, findCounterexample, parseRegexToDFA, dfaToRegex } from '@/lib/logic';

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

type TestResult = {
  input: string;
  expected: boolean;
  actual: boolean;
  passed: boolean;
};

export default function ProblemWorkspace({ problem }: { problem: Problem }) {
  const [editorMode, setEditorMode] = useState<'canvas' | 'json'>('canvas');

  // Default Canvas Layout
  const [nodes, setNodes] = useState<CanvasNode[]>([
    { id: 'q0', x: 100, y: 150, isInitial: true, isAccepting: false },
    { id: 'q1', x: 260, y: 150, isInitial: false, isAccepting: false },
    { id: 'q2', x: 420, y: 150, isInitial: false, isAccepting: true },
  ]);
  const [edges, setEdges] = useState<CanvasEdge[]>([]);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [edgeSourceId, setEdgeSourceId] = useState<string | null>(null);
  const [tool, setTool] = useState<'select' | 'addNode' | 'addEdge'>('select');
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);

  const [dfaJson, setDfaJson] = useState<string>(JSON.stringify(problem.answerDFA, null, 2));
  const [regexInput, setRegexInput] = useState<string>('');

  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [counterexample, setCounterexample] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);

  const graphToDFA = (): DFA => {
    const states = nodes.map((n) => n.id);
    const initialNode = nodes.find((n) => n.isInitial) || nodes[0];
    const acceptStates = nodes.filter((n) => n.isAccepting).map((n) => n.id);
    const transitions: Record<string, Record<string, string>> = {};

    states.forEach((s) => { transitions[s] = {}; });
    edges.forEach((e) => {
      const symList = e.symbols.split(/[\s,]+/).filter(Boolean);
      symList.forEach((sym) => {
        if (transitions[e.from]) transitions[e.from][sym] = e.to;
      });
    });

    return {
      states,
      alphabet: problem.alphabet,
      initialState: initialNode ? initialNode.id : '',
      acceptStates,
      transitions,
    };
  };

  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (tool === 'addNode' && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const newId = `q${nodes.length}`;
      setNodes([
        ...nodes,
        {
          id: newId,
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
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
        const symbol = prompt('Enter transition symbol(s):', '0');
        if (symbol) {
          setEdges([...edges, { id: `e_${Date.now()}`, from: edgeSourceId, to: nodeId, symbols: symbol }]);
        }
        setEdgeSourceId(null);
        setTool('select');
      }
    } else {
      setSelectedNodeId(nodeId);
    }
  };

  const handleRun = () => {
    setErrorMessage(null);
    setCounterexample(null);

    let studentDFA: DFA;
    try {
      if (problem.type === 'dfa-to-regex') {
        if (!regexInput.trim()) {
          setErrorMessage('Please enter a regular expression.');
          return;
        }
        studentDFA = parseRegexToDFA(regexInput, problem.alphabet);
      } else if (editorMode === 'canvas') {
        studentDFA = graphToDFA();
      } else {
        studentDFA = JSON.parse(dfaJson);
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Error processing input.');
      return;
    }

    const results: TestResult[] = problem.testCases.map((tc) => {
      const actual = runDFA(studentDFA, tc.input);
      return {
        input: tc.input === '' ? 'ε (empty string)' : tc.input,
        expected: tc.expected,
        actual,
        passed: actual === tc.expected,
      };
    });
    setTestResults(results);

    const mismatch = findCounterexample(studentDFA, problem.answerDFA);
    setCounterexample(mismatch);
  };

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        <Link href="/" className="text-xs font-semibold text-emerald-400 hover:text-emerald-300">
          &larr; Back to Problem Selector
        </Link>

        <header>
          <span className="text-xs uppercase tracking-widest text-emerald-400 font-semibold">
            Category: {problem.type}
          </span>
          <h1 className="text-3xl font-bold text-white mt-1">{problem.title}</h1>
          <p className="text-slate-400 mt-2">{problem.description}</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 flex flex-col gap-6">
            {problem.type !== 'dfa-to-regex' && (
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

            {problem.type !== 'dfa-to-regex' && editorMode === 'canvas' && (
              <div className="flex flex-col gap-3">
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

                <div className="relative border border-slate-800 bg-slate-950 rounded-xl overflow-hidden h-[340px]">
                  <svg
                    ref={svgRef}
                    className="w-full h-full cursor-crosshair"
                    onClick={handleCanvasClick}
                    onMouseMove={(e) => {
                      if (draggingNodeId && svgRef.current) {
                        const rect = svgRef.current.getBoundingClientRect();
                        setNodes(nodes.map((n) => (n.id === draggingNodeId ? { ...n, x: e.clientX - rect.left, y: e.clientY - rect.top } : n)));
                      }
                    }}
                    onMouseUp={() => setDraggingNodeId(null)}
                  >
                    <defs>
                      <marker id="arrow" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
                      </marker>
                    </defs>

                    {edges.map((e) => {
                      const fromNode = nodes.find((n) => n.id === e.from);
                      const toNode = nodes.find((n) => n.id === e.to);
                      if (!fromNode || !toNode) return null;
                      return (
                        <g key={e.id}>
                          <line x1={fromNode.x} y1={fromNode.y} x2={toNode.x} y2={toNode.y} stroke="#10b981" strokeWidth="2" markerEnd="url(#arrow)" />
                          <text x={(fromNode.x + toNode.x) / 2} y={(fromNode.y + toNode.y) / 2 - 8} fill="#a7f3d0" fontSize="12" textAnchor="middle">
                            {e.symbols}
                          </text>
                        </g>
                      );
                    })}

                    {nodes.map((n) => (
                      <g key={n.id} onClick={(e) => handleNodeClick(n.id, e)} onMouseDown={() => tool === 'select' && setDraggingNodeId(n.id)}>
                        <circle cx={n.x} cy={n.y} r={24} className={`${selectedNodeId === n.id ? 'stroke-amber-400 stroke-[3]' : 'stroke-emerald-500 stroke-2'} fill-slate-900`} />
                        {n.isAccepting && <circle cx={n.x} cy={n.y} r={18} className="stroke-emerald-500 stroke-2 fill-none" />}
                        <text x={n.x} y={n.y + 4} fill="#ffffff" fontSize="13" textAnchor="middle" className="font-mono font-bold select-none">{n.id}</text>
                      </g>
                    ))}
                  </svg>
                </div>
              </div>
            )}

            {problem.type !== 'dfa-to-regex' && editorMode === 'json' && (
              <textarea
                value={dfaJson}
                onChange={(e) => setDfaJson(e.target.value)}
                rows={10}
                className="w-full bg-slate-950 font-mono text-sm p-4 rounded-lg border border-slate-800 text-emerald-300 focus:outline-none"
              />
            )}

            {problem.type === 'dfa-to-regex' && (
              <input
                type="text"
                value={regexInput}
                onChange={(e) => setRegexInput(e.target.value)}
                placeholder="e.g. (1*0)* or (0|1)*01"
                className="w-full bg-slate-950 font-mono text-sm p-3 rounded-lg border border-slate-800 text-emerald-300 focus:outline-none"
              />
            )}

            {errorMessage && (
              <div className="bg-red-950/50 border border-red-500/50 text-red-300 p-3 rounded-md text-sm">{errorMessage}</div>
            )}

            <button onClick={handleRun} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-lg transition shadow-lg">
              Run Tests & Verify
            </button>
          </div>

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
                    </div>
                  ) : (
                    <div className="bg-amber-950/60 border border-amber-500/50 text-amber-300 p-4 rounded-lg text-sm">
                      <strong>Equivalence Check Failed</strong>
                      <p className="text-xs mt-1">Failed counterexample string: <code>{counterexample}</code></p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {testResults.map((res, idx) => (
                      <div key={idx} className={`px-3 py-2 rounded border text-xs ${res.passed ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300' : 'bg-red-950/30 border-red-800/50 text-red-300'}`}>
                        <span className="font-mono font-semibold">{res.input}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}