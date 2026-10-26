'use client';

import React, { useState } from 'react';
import { DFA } from '@/types/automata';

interface CanvasEditorProps {
  alphabet: string[];
  dfa: DFA;
  onChange: (updatedDfa: DFA) => void;
}

interface NodePosition {
  [state: string]: { x: number; y: number };
}

export const CanvasEditor: React.FC<CanvasEditorProps> = ({ alphabet, dfa, onChange }) => {
  const [nodePositions, setNodePositions] = useState<NodePosition>({
    q0: { x: 120, y: 150 },
    q1: { x: 280, y: 100 },
    q2: { x: 280, y: 200 },
    q3: { x: 440, y: 150 },
  });

  const [selectedState, setSelectedState] = useState<string | null>(dfa.initialState || 'q0');

  // Dragging state node logic
  const [draggingState, setDraggingState] = useState<string | null>(null);

  const handleMouseDown = (state: string) => {
    setSelectedState(state);
    setDraggingState(state);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!draggingState) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(40, Math.min(rect.width - 40, e.clientX - rect.left));
    const y = Math.max(40, Math.min(rect.height - 40, e.clientY - rect.top));

    setNodePositions((prev) => ({
      ...prev,
      [draggingState]: { x, y },
    }));
  };

  const handleMouseUp = () => {
    setDraggingState(null);
  };

  const addState = () => {
    let nextIdx = dfa.states.length;
    let newName = `q${nextIdx}`;
    while (dfa.states.includes(newName)) {
      nextIdx++;
      newName = `q${nextIdx}`;
    }

    const updatedStates = [...dfa.states, newName];
    const newPositions = {
      ...nodePositions,
      [newName]: { x: 200 + (nextIdx % 4) * 80, y: 150 + (nextIdx % 2) * 50 },
    };

    setNodePositions(newPositions);
    onChange({
      ...dfa,
      states: updatedStates,
      transitions: { ...dfa.transitions, [newName]: {} },
    });
    setSelectedState(newName);
  };

  const toggleAcceptState = (state: string) => {
    const isAccept = dfa.acceptStates.includes(state);
    const updatedAccept = isAccept
      ? dfa.acceptStates.filter((s) => s !== state)
      : [...dfa.acceptStates, state];

    onChange({ ...dfa, acceptStates: updatedAccept });
  };

  const setInitialState = (state: string) => {
    onChange({ ...dfa, initialState: state });
  };

  const deleteState = (state: string) => {
    if (dfa.states.length <= 1) return;

    const newStates = dfa.states.filter((s) => s !== state);
    const newAccept = dfa.acceptStates.filter((s) => s !== state);
    const newInitial = dfa.initialState === state ? newStates[0] : dfa.initialState;

    const newTransitions = { ...dfa.transitions };
    delete newTransitions[state];
    Object.keys(newTransitions).forEach((from) => {
      Object.keys(newTransitions[from] || {}).forEach((sym) => {
        if (newTransitions[from][sym] === state) {
          delete newTransitions[from][sym];
        }
      });
    });

    onChange({
      ...dfa,
      states: newStates,
      initialState: newInitial,
      acceptStates: newAccept,
      transitions: newTransitions,
    });

    setSelectedState(newInitial);
  };

  const setTransition = (from: string, sym: string, to: string) => {
    const updated = { ...dfa.transitions };
    if (!updated[from]) updated[from] = {};
    if (to === '') {
      delete updated[from][sym];
    } else {
      updated[from][sym] = to;
    }
    onChange({ ...dfa, transitions: updated });
  };

  // Group transitions between states for rendering edge labels
  const getTransitionsList = () => {
    const map: { [key: string]: string[] } = {};
    dfa.states.forEach((from) => {
      const stateTrans = dfa.transitions[from] || {};
      Object.entries(stateTrans).forEach(([sym, to]) => {
        if (!to) return;
        const key = `${from}->${to}`;
        if (!map[key]) map[key] = [];
        map[key].push(sym);
      });
    });
    return map;
  };

  const edgeMap = getTransitionsList();

  return (
    <div className="flex flex-col gap-4 bg-slate-900 border border-slate-800 rounded-xl p-5">
      {/* Top Toolbar */}
      <div className="flex justify-between items-center bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={addState}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded transition"
          >
            + Add State
          </button>
          <span className="text-slate-400">
            States: <strong className="text-white font-mono">{dfa.states.length}</strong>
          </span>
        </div>

        {selectedState && (
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-mono">State: {selectedState}</span>
            <button
              onClick={() => setInitialState(selectedState)}
              disabled={dfa.initialState === selectedState}
              className={`px-2.5 py-1 rounded text-xs ${
                dfa.initialState === selectedState
                  ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              {dfa.initialState === selectedState ? '✓ Initial' : 'Set Start'}
            </button>
            <button
              onClick={() => toggleAcceptState(selectedState)}
              className={`px-2.5 py-1 rounded text-xs ${
                dfa.acceptStates.includes(selectedState)
                  ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/50'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              {dfa.acceptStates.includes(selectedState) ? '✓ Accept State' : 'Make Accept'}
            </button>
            {dfa.states.length > 1 && (
              <button
                onClick={() => deleteState(selectedState)}
                className="px-2.5 py-1 bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800/50 rounded"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>

      {/* SVG Canvas Area */}
      <div className="relative w-full h-[320px] bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
        <svg
          className="w-full h-full cursor-crosshair select-none"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="8"
              markerHeight="6"
              refX="18"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#10b981" />
            </marker>
          </defs>

          {/* Render Transitions (Edges) */}
          {Object.entries(edgeMap).map(([key, symbols]) => {
            const [from, to] = key.split('->');
            const posFrom = nodePositions[from] || { x: 100, y: 100 };
            const posTo = nodePositions[to] || { x: 200, y: 100 };
            const label = symbols.join(',');

            // Self-loop
            if (from === to) {
              return (
                <g key={key}>
                  <path
                    d={`M ${posFrom.x - 10} ${posFrom.y - 20} A 20 20 0 1 1 ${posFrom.x + 10} ${
                      posFrom.y - 20
                    }`}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                    markerEnd="url(#arrowhead)"
                  />
                  <text
                    x={posFrom.x}
                    y={posFrom.y - 45}
                    fill="#34d399"
                    fontSize="11"
                    textAnchor="middle"
                    className="font-mono font-bold"
                  >
                    {label}
                  </text>
                </g>
              );
            }

            // Curve offset for reciprocal edges
            const hasReciprocal = edgeMap[`${to}->${from}`];
            const dx = posTo.x - posFrom.x;
            const dy = posTo.y - posFrom.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const normX = dx / dist;
            const normY = dy / dist;

            const curveOffset = hasReciprocal ? 25 : 0;
            const midX = (posFrom.x + posTo.x) / 2 - normY * curveOffset;
            const midY = (posFrom.y + posTo.y) / 2 + normX * curveOffset;

            const pathD = hasReciprocal
              ? `M ${posFrom.x} ${posFrom.y} Q ${midX} ${midY} ${posTo.x} ${posTo.y}`
              : `M ${posFrom.x} ${posFrom.y} L ${posTo.x} ${posTo.y}`;

            return (
              <g key={key}>
                <path
                  d={pathD}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  markerEnd="url(#arrowhead)"
                />
                <text
                  x={midX}
                  y={midY - 5}
                  fill="#34d399"
                  fontSize="11"
                  textAnchor="middle"
                  className="font-mono font-bold bg-slate-950"
                >
                  {label}
                </text>
              </g>
            );
          })}

          {/* Render State Nodes */}
          {dfa.states.map((state) => {
            const pos = nodePositions[state] || { x: 100, y: 100 };
            const isSelected = selectedState === state;
            const isInitial = dfa.initialState === state;
            const isAccept = dfa.acceptStates.includes(state);

            return (
              <g
                key={state}
                transform={`translate(${pos.x}, ${pos.y})`}
                onMouseDown={() => handleMouseDown(state)}
                className="cursor-pointer"
              >
                {/* Initial Arrow */}
                {isInitial && (
                  <path
                    d="M -45 0 L -22 0"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                    markerEnd="url(#arrowhead)"
                  />
                )}

                {/* Outer Accept Circle */}
                {isAccept && (
                  <circle
                    r="24"
                    fill="none"
                    stroke={isSelected ? '#10b981' : '#059669'}
                    strokeWidth="2"
                  />
                )}

                {/* Main Node Circle */}
                <circle
                  r="20"
                  fill={isSelected ? '#064e3b' : '#0f172a'}
                  stroke={isSelected ? '#34d399' : isInitial ? '#38bdf8' : '#475569'}
                  strokeWidth={isSelected ? '3' : '2'}
                />

                {/* Label */}
                <text
                  fill="#f8fafc"
                  fontSize="12"
                  fontWeight="bold"
                  textAnchor="middle"
                  dy="4"
                  className="font-mono pointer-events-none"
                >
                  {state}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Transition Matrix / Form Editor */}
      <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
          Transition Table Editor
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="p-2">State</th>
                {alphabet.map((sym) => (
                  <th key={sym} className="p-2 text-center">
                    Input '{sym}'
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dfa.states.map((state) => (
                <tr key={state} className="border-b border-slate-800/50 hover:bg-slate-900/50">
                  <td className="p-2 text-emerald-400 font-bold">
                    {state} {dfa.initialState === state ? '(start)' : ''}{' '}
                    {dfa.acceptStates.includes(state) ? '*' : ''}
                  </td>
                  {alphabet.map((sym) => {
                    const currentTo = dfa.transitions[state]?.[sym] || '';
                    return (
                      <td key={sym} className="p-2 text-center">
                        <select
                          value={currentTo}
                          onChange={(e) => setTransition(state, sym, e.target.value)}
                          className="bg-slate-900 text-white border border-slate-700 rounded px-2 py-1 text-xs focus:border-emerald-500 focus:outline-none"
                        >
                          <option value="">-- None --</option>
                          {dfa.states.map((s) => (
                            <option key={s} value={s}>
                              &rarr; {s}
                            </option>
                          ))}
                        </select>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};