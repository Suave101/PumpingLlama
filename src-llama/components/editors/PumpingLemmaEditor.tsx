import React from 'react';
import { PumpingLemmaSubmission } from '@/types/automata';

interface PumpingLemmaEditorProps {
  value: PumpingLemmaSubmission;
  onChange: (val: PumpingLemmaSubmission) => void;
}

export const PumpingLemmaEditor: React.FC<PumpingLemmaEditorProps> = ({ value, onChange }) => {
  return (
    <div className="flex flex-col gap-4 bg-slate-900 p-5 rounded-xl border border-slate-800 text-xs">
      <h3 className="text-sm font-bold text-emerald-400">Pumping Lemma Proof</h3>
      <ol className="list-decimal list-inside text-slate-400 space-y-1 leading-relaxed">
        <li>The adversary picks a pumping length p ≥ 1.</li>
        <li>You pick a string w ∈ L, written in terms of p, with |w| ≥ p.</li>
        <li>The adversary splits w = uvxyz with |vxy| ≤ p and |vy| ≥ 1. The checker tries every such split.</li>
        <li>You win if, for every split, some uvⁱxyⁱz is not in L.</li>
      </ol>
      <div>
        <label htmlFor="pumping-w" className="text-slate-400 block mb-1">
          Your string w (exponent notation: x^p, x^{'{'}2p+1{'}'}, (xy)^p):
        </label>
        <input
          id="pumping-w"
          type="text"
          value={value.w}
          onChange={(e) => onChange({ w: e.target.value })}
          spellCheck={false}
          className="w-full bg-slate-950 p-2 rounded border border-slate-800 text-emerald-300 font-mono text-sm focus:outline-none focus:border-emerald-500"
        />
      </div>
    </div>
  );
};
