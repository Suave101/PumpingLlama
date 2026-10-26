import React from 'react';
import { PumpingLemmaSubmission } from '@/types/automata';

interface PumpingLemmaEditorProps {
  value: PumpingLemmaSubmission;
  onChange: (val: PumpingLemmaSubmission) => void;
}

export const PumpingLemmaEditor: React.FC<PumpingLemmaEditorProps> = ({ value, onChange }) => {
  const parts: (keyof Pick<PumpingLemmaSubmission, 'u' | 'v' | 'x' | 'y' | 'z'>)[] = [
    'u',
    'v',
    'x',
    'y',
    'z',
  ];

  return (
    <div className="flex flex-col gap-4 bg-slate-900 p-5 rounded-xl border border-slate-800">
      <h3 className="text-sm font-bold text-emerald-400">Pumping Lemma Adversarial Proof (w = u v x y z)</h3>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <label className="text-slate-400 block mb-1">Pumping Length (p):</label>
          <input
            type="number"
            value={value.p}
            onChange={(e) => onChange({ ...value, p: parseInt(e.target.value) || 0 })}
            className="w-full bg-slate-950 p-2 rounded border border-slate-800 text-white font-mono"
          />
        </div>
        <div>
          <label className="text-slate-400 block mb-1">Target String w (|w| ≥ p):</label>
          <input
            type="text"
            value={value.w}
            onChange={(e) => onChange({ ...value, w: e.target.value })}
            className="w-full bg-slate-950 p-2 rounded border border-slate-800 text-white font-mono"
          />
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2 text-xs">
        {parts.map((part) => (
          <div key={part}>
            <label className="text-slate-400 block mb-1 uppercase font-bold">{part}:</label>
            <input
              type="text"
              value={value[part]}
              onChange={(e) => onChange({ ...value, [part]: e.target.value })}
              className="w-full bg-slate-950 p-2 rounded border border-slate-800 text-emerald-300 font-mono"
            />
          </div>
        ))}
      </div>

      <div>
        <label className="text-slate-400 text-xs block mb-1">Pumping Exponent (i):</label>
        <input
          type="number"
          value={value.i}
          onChange={(e) => onChange({ ...value, i: parseInt(e.target.value) || 0 })}
          className="w-full bg-slate-950 p-2 rounded border border-slate-800 text-white font-mono text-xs"
        />
      </div>
    </div>
  );
};