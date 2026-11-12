'use client';

import React, { useState } from 'react';
import type { TableBlock } from '@/lib/textbook/types';
import { cellKey, checkTable, type TableCheck } from '@/lib/textbook/exercises';
import { Markdown } from './Markdown';

type Cells = Record<string, string>;
type TableProps = { block: TableBlock; response: Cells | undefined; onRespond: (cells: Cells) => void };

const show = (w: string) => (w === '' ? 'ε' : w);

// A DFA transition table with some cells left blank. Rows are states (→ start, * accepting).
export const TableActivity: React.FC<TableProps> = ({ block, response, onRespond }) => {
  const { dfa } = block;
  const [cells, setCells] = useState<Cells>(response ?? {});
  const [result, setResult] = useState<TableCheck | null>(response ? checkTable(block, response) : null);
  const [wrongChecks, setWrongChecks] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const isBlank = (q: string, a: string) => block.blanks.some(([bq, ba]) => bq === q && ba === a);

  return (
    <>
      <Markdown inline>{block.prompt}</Markdown>
      <div className="overflow-x-auto">
        <table className="font-mono text-sm border-collapse">
          <thead>
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold text-steel-500">state</th>
              {dfa.alphabet.map((a) => (
                <th key={a} className="px-3 py-2 text-xs font-semibold text-steel-500">
                  on {a}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dfa.states.map((q) => (
              <tr key={q} className="border-t border-steel-800">
                <th scope="row" className="px-3 py-2 text-left font-normal text-steel-200 whitespace-nowrap">
                  <span className="inline-block w-4 text-arc-400">{q === dfa.initialState ? '→' : ''}</span>
                  <span className="inline-block w-3 text-gold-400">{dfa.acceptStates.includes(q) ? '*' : ''}</span>
                  {q}
                </th>
                {dfa.alphabet.map((a) =>
                  isBlank(q, a) ? (
                    <td key={a} className="px-2 py-1.5">
                      <select
                        aria-label={`δ(${q}, ${a})`}
                        value={cells[cellKey(q, a)] ?? ''}
                        onChange={(e) => {
                          setCells((prev) => ({ ...prev, [cellKey(q, a)]: e.target.value }));
                          setResult(null);
                        }}
                        className="bg-steel-950 border border-arc-600/60 rounded-md px-2 py-1 text-arc-200"
                      >
                        <option value="">?</option>
                        {dfa.states.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      {revealed && <span className="ml-2 text-xs text-gold-300">{dfa.transitions[q][a]}</span>}
                    </td>
                  ) : (
                    <td key={a} className="px-3 py-2 text-center text-steel-300">
                      {dfa.transitions[q][a]}
                    </td>
                  )
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-steel-500">→ marks the start state and * marks accepting states.</p>
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => {
            const check = checkTable(block, cells);
            setResult(check);
            if (check.status === 'incomplete') return;
            if (check.status === 'wrong') setWrongChecks((n) => n + 1);
            onRespond(cells);
          }}
          className="px-4 py-1.5 rounded-lg bg-crimson-600 hover:bg-crimson-500 text-white text-sm font-medium transition"
        >
          Check
        </button>
        {wrongChecks >= 2 && !revealed && result?.status !== 'correct' && (
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className="px-3 py-1.5 rounded-lg border border-steel-700 text-sm text-steel-300 hover:text-white transition"
          >
            Show answer
          </button>
        )}
      </div>
      {result?.status === 'incomplete' && <p className="text-sm text-steel-400">Fill in every blank cell first.</p>}
      {result?.status === 'correct' && <p className="text-sm text-gold-300">Correct. Your table accepts exactly the right strings.</p>}
      {result?.status === 'wrong' && (
        <p className="text-sm text-red-300">
          Not quite. Your machine {result.shouldAccept ? 'rejects' : 'accepts'}{' '}
          <code className="font-mono">{show(result.counterexample)}</code>, which should be{' '}
          {result.shouldAccept ? 'accepted' : 'rejected'}.
        </p>
      )}
      {revealed && result?.status !== 'correct' && (
        <p className="text-sm text-steel-400">The answer appears next to each blank. Choose it to get credit.</p>
      )}
    </>
  );
};
