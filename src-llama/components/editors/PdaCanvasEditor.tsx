'use client';

import React, { useState } from 'react';
import { PDA, PDATransition } from '@/types/automata';

interface PdaCanvasEditorProps {
  pda: PDA;
  onChange: (updatedPda: PDA) => void;
}

interface NodePosition {
  [state: string]: { x: number; y: number };
}

export const PdaCanvasEditor: React.FC<PdaCanvasEditorProps> = ({ pda, onChange }) => {
  // Draggable Node Positions
  const [nodePositions, setNodePositions] = useState<NodePosition>({
    q0: { x: 120, y: 150 },
    q1: { x: 300, y: 150 },
    q2: { x: 480, y: 150 },
  });

  const [selectedState, setSelectedState] = useState<string | null>(pda.initialState || 'q0');
  const [draggingState, setDraggingState] = useState<string | null>(null);

  // New Transition Form State
  const [newTransFrom, setNewTransFrom] = useState<string>(pda.initialState || 'q0');
  const [newTransTo, setNewTransTo] = useState<string>(pda.initialState || 'q0');
  const [newTransInput, setNewTransInput] = useState<string>(''); // '' represents ε
  const [newTransPop, setNewTransPop] = useState<string>(''); // '' represents ε
  const [newTransPush, setNewTransPush] = useState<string>(''); // comma-separated or space-separated

  // Node Dragging Logic
  const handleMouseDown = (state: string) => {
    setSelectedState(state);
    setDraggingState(state);
    setNewTransFrom(state);
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

  const handleMouseUp = () => setDraggingState(null);

  // State Management Actions
  const addState = () => {
    let nextIdx = pda.states.length;
    let newName = `q${nextIdx}`;
    while (pda.states.includes(newName)) {
      nextIdx++;
      newName = `q${nextIdx}`;
    }

    const updatedStates = [...pda.states, newName];
    setNodePositions((prev) => ({
      ...prev,
      [newName]: { x: 150 + (nextIdx % 4) * 110, y: 150 + (nextIdx % 2) * 60 },
    }));

    onChange({ ...pda, states: updatedStates });
    setSelectedState(newName);
    setNewTransFrom(newName);
  };

  const toggleAcceptState = (state: string) => {
    const isAccept = pda.acceptStates.includes(state);
    const updatedAccept = isAccept
      ? pda.acceptStates.filter((s) => s !== state)
      : [...pda.acceptStates, state];
    onChange({ ...pda, acceptStates: updatedAccept });
  };

  const setInitialState = (state: string) => {
    onChange({ ...pda, initialState: state });
  };

  const deleteState = (state: string) => {
    if (pda.states.length <= 1) return;

    const newStates = pda.states.filter((s) => s !== state);
    const newAccept = pda.acceptStates.filter((s) => s !== state);
    const newInitial = pda.initialState === state ? newStates[0] : pda.initialState;
    const newTransitions = pda.transitions.filter((t) => t.from !== state && t.to !== state);

    onChange({
      ...pda,
      states: newStates,
      initialState: newInitial,
      acceptStates: newAccept,
      transitions: newTransitions,
    });
    setSelectedState(newInitial);
  };

  // Transition Management
  const handleAddTransition = (e: React.FormEvent) => {
    e.preventDefault();
    const pushSymbols = newTransPush
      .trim()
      .split(/[\s,]+/)
      .filter((s) => s.length > 0 && s !== 'ε');

    const newTr: PDATransition = {
      from: newTransFrom,
      to: newTransTo,
      inputSymbol: newTransInput === 'ε' ? '' : newTransInput,
      popSymbol: newTransPop === 'ε' ? '' : newTransPop,
      pushSymbols,
    };

    onChange({
      ...pda,
      transitions: [...pda.transitions, newTr],
    });

    setNewTransPush('');
  };

  const deleteTransition = (index: number) => {
    const updated = pda.transitions.filter((_, idx) => idx !== index);
    onChange({ ...pda, transitions: updated });
  };

  // Format transition string representation: input, pop -> push
  const formatTransitionLabel = (tr: PDATransition) => {
    const inp = tr.inputSymbol || 'ε';
    const pop = tr.popSymbol || 'ε';
    const push = tr.pushSymbols.length > 0 ? tr.pushSymbols.join('') : 'ε';
    return `${inp}, ${pop} → ${push}`;
  };

  // Group transitions by edge (from -> to) for rendering labels
  const getTransitionsList = () => {
    const map: { [key: string]: string[] } = {};
    pda.transitions.forEach((tr) => {
      const key = `${tr.from}->${tr.to}`;
      if (!map[key]) map[key] = [];
      map[key].push(formatTransitionLabel(tr));
    });
    return map;
  };

  const edgeMap = getTransitionsList();

  return (
    <div className="flex flex-col gap-5 bg-slate-900 border border-slate-800 rounded-xl p-5">
      {/* Top Configuration Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
        <div>
          <label className="text-slate-400 block mb-1">Acceptance Mode:</label>
          <select
            value={pda.acceptBy}
            onChange={(e) =>
              onChange({ ...pda, acceptBy: e.target.value as 'final-state' | 'empty-stack' })
            }
            className="w-full bg-slate-900 border border-slate-700 text-emerald-300 rounded px-2 py-1 focus:outline-none"
          >
            <option value="final-state">Accept by Final State</option>
            <option value="empty-stack">Accept by Empty Stack</option>
          </select>
        </div>

        <div>
          <label className="text-slate-400 block mb-1">Initial Stack Symbol:</label>
          <input
            type="text"
            value={pda.initialStackSymbol}
            onChange={(e) => onChange({ ...pda, initialStackSymbol: e.target.value })}
            className="w-full bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 font-mono focus:outline-none"
          />
        </div>

        <div>
          <label className="text-slate-400 block mb-1">Stack Alphabet (comma-separated):</label>
          <input
            type="text"
            value={pda.stackAlphabet.join(', ')}
            onChange={(e) =>
              onChange({
                ...pda,
                stackAlphabet: e.target.value.split(',').map((s) => s.trim()),
              })
            }
            className="w-full bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 font-mono focus:outline-none"
          />
        </div>
      </div>

      {/* State Actions Toolbar */}
      <div className="flex justify-between items-center bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={addState}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded transition"
          >
            + Add State
          </button>
          <span className="text-slate-400">
            States: <strong className="text-white font-mono">{pda.states.length}</strong>
          </span>
        </div>

        {selectedState && (
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-mono">Selected: {selectedState}</span>
            <button
              onClick={() => setInitialState(selectedState)}
              disabled={pda.initialState === selectedState}
              className={`px-2.5 py-1 rounded ${
                pda.initialState === selectedState
                  ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              {pda.initialState === selectedState ? '✓ Start' : 'Set Start'}
            </button>
            {pda.acceptBy === 'final-state' && (
              <button
                onClick={() => toggleAcceptState(selectedState)}
                className={`px-2.5 py-1 rounded ${
                  pda.acceptStates.includes(selectedState)
                    ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/50'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                {pda.acceptStates.includes(selectedState) ? '✓ Accept' : 'Make Accept'}
              </button>
            )}
            {pda.states.length > 1 && (
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

      {/* Interactive Canvas Area */}
      <div className="relative w-full h-[320px] bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
        <svg
          className="w-full h-full cursor-crosshair select-none"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <defs>
            <marker
              id="pda-arrowhead"
              markerWidth="8"
              markerHeight="6"
              refX="18"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#10b981" />
            </marker>
          </defs>

          {/* Transitions / Edges */}
          {Object.entries(edgeMap).map(([key, labels]) => {
            const [from, to] = key.split('->');
            const posFrom = nodePositions[from] || { x: 100, y: 100 };
            const posTo = nodePositions[to] || { x: 250, y: 100 };

            // Self-loop
            if (from === to) {
              return (
                <g key={key}>
                  <path
                    d={`M ${posFrom.x - 10} ${posFrom.y - 20} A 22 22 0 1 1 ${posFrom.x + 10} ${
                      posFrom.y - 20
                    }`}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                    markerEnd="url(#pda-arrowhead)"
                  />
                  <text
                    x={posFrom.x}
                    y={posFrom.y - 50}
                    fill="#34d399"
                    fontSize="10"
                    textAnchor="middle"
                    className="font-mono font-semibold"
                  >
                    {labels.join(' | ')}
                  </text>
                </g>
              );
            }

            // Curve calculation for bi-directional edges
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
                  markerEnd="url(#pda-arrowhead)"
                />
                <text
                  x={midX}
                  y={midY - 6}
                  fill="#34d399"
                  fontSize="10"
                  textAnchor="middle"
                  className="font-mono font-semibold"
                >
                  {labels.join(' | ')}
                </text>
              </g>
            );
          })}

          {/* State Nodes */}
          {pda.states.map((state) => {
            const pos = nodePositions[state] || { x: 100, y: 100 };
            const isSelected = selectedState === state;
            const isInitial = pda.initialState === state;
            const isAccept = pda.acceptBy === 'final-state' && pda.acceptStates.includes(state);

            return (
              <g
                key={state}
                transform={`translate(${pos.x}, ${pos.y})`}
                onMouseDown={() => handleMouseDown(state)}
                className="cursor-pointer"
              >
                {/* Start Arrow */}
                {isInitial && (
                  <path
                    d="M -45 0 L -22 0"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                    markerEnd="url(#pda-arrowhead)"
                  />
                )}

                {/* Double Circle for Accept States */}
                {isAccept && (
                  <circle
                    r="24"
                    fill="none"
                    stroke={isSelected ? '#10b981' : '#059669'}
                    strokeWidth="2"
                  />
                )}

                {/* Node Body */}
                <circle
                  r="20"
                  fill={isSelected ? '#064e3b' : '#0f172a'}
                  stroke={isSelected ? '#34d399' : isInitial ? '#38bdf8' : '#475569'}
                  strokeWidth={isSelected ? '3' : '2'}
                />

                {/* State Name */}
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

      {/* PDA Transition Creator & List */}
      <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col gap-4">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Add PDA Transition
        </h4>

        <form onSubmit={handleAddTransition} className="grid grid-cols-2 md:grid-cols-6 gap-2 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">From State:</label>
            <select
              value={newTransFrom}
              onChange={(e) => setNewTransFrom(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded p-1.5 font-mono"
            >
              {pda.states.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Input (ε for empty):</label>
            <input
              type="text"
              placeholder="e.g. a or ε"
              value={newTransInput}
              onChange={(e) => setNewTransInput(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-emerald-300 rounded p-1.5 font-mono"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Pop Symbol:</label>
            <input
              type="text"
              placeholder="e.g. Z0 or ε"
              value={newTransPop}
              onChange={(e) => setNewTransPop(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-amber-300 rounded p-1.5 font-mono"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Push Symbols:</label>
            <input
              type="text"
              placeholder="e.g. A Z0 or ε"
              value={newTransPush}
              onChange={(e) => setNewTransPush(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-cyan-300 rounded p-1.5 font-mono"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">To State:</label>
            <select
              value={newTransTo}
              onChange={(e) => setNewTransTo(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded p-1.5 font-mono"
            >
              {pda.states.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-1.5 rounded transition"
            >
              + Add Transition
            </button>
          </div>
        </form>

        {/* Existing Transitions List */}
        <div className="mt-2">
          <h5 className="text-xs text-slate-400 mb-2 font-semibold">Active Transitions:</h5>
          {pda.transitions.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No transitions defined yet.</p>
          ) : (
            <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
              {pda.transitions.map((tr, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center bg-slate-900 border border-slate-800 px-3 py-1.5 rounded text-xs font-mono"
                >
                  <div>
                    <span className="text-emerald-400">{tr.from}</span>
                    <span className="text-slate-500"> &rarr; </span>
                    <span className="text-emerald-400">{tr.to}</span>
                    <span className="text-slate-400 ml-3">
                      ({formatTransitionLabel(tr)})
                    </span>
                  </div>
                  <button
                    onClick={() => deleteTransition(idx)}
                    className="text-red-400 hover:text-red-300 text-xs px-2 py-0.5"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};