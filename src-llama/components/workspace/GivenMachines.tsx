import React from 'react';
import { CFG, DFA } from '@/types/automata';

function Sentential({ form, variables }: { form: string; variables: string[] }) {
  const symbols = form.replace(/\s+/g, '').split('');
  if (symbols.length === 0) return <span className="text-arc-300">ε</span>;
  return (
    <>
      {symbols.map((s, i) => (
        <span key={i} className={variables.includes(s) ? 'text-arc-300 font-semibold' : 'text-steel-100'}>
          {s}
        </span>
      ))}
    </>
  );
}

export function GrammarCard({ cfg, title = 'Grammar' }: { cfg: CFG; title?: string }) {
  return (
    <div className="bg-steel-900 border border-steel-800 rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gold-400">{title}</h3>
        <span className="text-[11px] text-steel-400">
          start symbol <span className="font-mono text-arc-300 font-semibold">{cfg.startSymbol}</span>
        </span>
      </div>
      <table className="font-mono text-lg self-start">
        <tbody>
          {cfg.rules.map((rule) => (
            <tr key={rule.lhs}>
              <td className="pr-3 py-1 text-right text-arc-300 font-semibold align-top">{rule.lhs}</td>
              <td className="pr-3 py-1 text-steel-500 align-top">→</td>
              <td className="py-1">
                {rule.rhs.map((prod, i) => (
                  <span key={i}>
                    {i > 0 && <span className="text-steel-500 px-2">|</span>}
                    <Sentential form={prod} variables={cfg.variables} />
                  </span>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-[11px] text-steel-500">
        <span className="text-arc-300">Variables</span> are highlighted; everything else is a terminal.
      </p>
    </div>
  );
}

export function DFATable({ dfa, title = 'Given DFA' }: { dfa: DFA; title?: string }) {
  return (
    <div className="bg-steel-900 border border-steel-800 rounded-xl p-5 flex flex-col gap-3">
      <h3 className="text-sm font-bold text-gold-400">{title}</h3>
      <table className="font-mono text-sm w-full text-left">
        <thead>
          <tr className="text-steel-400 border-b border-steel-800">
            <th className="py-1.5 pr-4 font-medium">State</th>
            {dfa.alphabet.map((a) => (
              <th key={a} className="py-1.5 pr-4 font-medium">
                on {a}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dfa.states.map((s) => {
            const isStart = s === dfa.initialState;
            const isAccept = dfa.acceptStates.includes(s);
            return (
              <tr key={s} className="border-b border-steel-800/60 last:border-0">
                <td className="py-1.5 pr-4">
                  <span className="inline-block w-4 text-gold-400">{isStart ? '→' : ''}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded ${
                      isAccept ? 'border-2 border-double border-gold-400 text-gold-200' : 'text-steel-100'
                    }`}
                  >
                    {s}
                  </span>
                </td>
                {dfa.alphabet.map((a) => (
                  <td key={a} className="py-1.5 pr-4 text-steel-300">
                    {dfa.transitions[s]?.[a] ?? '—'}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-[11px] text-steel-500">
        <span className="text-gold-400">→</span> start state · double border = accepting state
      </p>
    </div>
  );
}
