'use client';

import React from 'react';
import { AmbiguityProof } from '@/types/automata';

interface AmbiguityEditorProps {
  value: AmbiguityProof;
  onChange: (val: AmbiguityProof) => void;
}

export const AmbiguityEditor: React.FC<AmbiguityEditorProps> = ({ value, onChange }) => {
  const handleStringChange = (stringW: string) => {
    onChange({ ...value, stringW });
  };

  const handleDerivationChange = (
    key: 'leftDerivation1' | 'leftDerivation2',
    index: number,
    val: string
  ) => {
    const updated = [...value[key]];
    updated[index] = val;
    onChange({ ...value, [key]: updated });
  };

  const handleAddStep = (key: 'leftDerivation1' | 'leftDerivation2') => {
    const currentList = value[key];
    const lastStep = currentList[currentList.length - 1] || 'S';
    onChange({ ...value, [key]: [...currentList, lastStep] });
  };

  const handleRemoveStep = (key: 'leftDerivation1' | 'leftDerivation2', index: number) => {
    if (value[key].length <= 2) return; // Keep at least 2 steps
    const updated = value[key].filter((_, idx) => idx !== index);
    onChange({ ...value, [key]: updated });
  };

  const d1Yield = value.leftDerivation1[value.leftDerivation1.length - 1] || '';
  const d2Yield = value.leftDerivation2[value.leftDerivation2.length - 1] || '';
  const isDistinct = value.leftDerivation1.join('=>') !== value.leftDerivation2.join('=>');
  const isValidProof =
    value.stringW.length > 0 &&
    d1Yield === value.stringW &&
    d2Yield === value.stringW &&
    isDistinct;

  return (
    <div className="flex flex-col gap-5 bg-slate-900 border border-slate-800 rounded-xl p-5">
      {/* Proof Status Header */}
      <div className="flex justify-between items-center bg-slate-950 p-3.5 rounded-lg border border-slate-800">
        <div>
          <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
            Ambiguity Proof Visualizer
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Demonstrate grammar ambiguity by finding 2 distinct leftmost derivations for string w.
          </p>
        </div>

        <div
          className={`px-3 py-1 rounded text-xs font-mono font-bold border ${
            isValidProof
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
              : 'bg-amber-950/80 text-amber-300 border-amber-500/50'
          }`}
        >
          {isValidProof ? '✓ Valid Ambiguity Proof' : '⚠ Incomplete Proof'}
        </div>
      </div>

      {/* Target String Input */}
      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
        <label className="text-slate-300 font-semibold block mb-1">Target String (w):</label>
        <input
          type="text"
          value={value.stringW}
          onChange={(e) => handleStringChange(e.target.value)}
          placeholder="e.g. a+a*a"
          className="w-full bg-slate-900 border border-slate-700 text-emerald-300 font-mono text-sm p-2 rounded focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Dual Pipeline Derivation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Leftmost Derivation #1 */}
        <div className="flex flex-col gap-3 bg-slate-950 p-4 rounded-lg border border-slate-800">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="font-bold text-sky-400 font-mono">Derivation Path #1</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                d1Yield === value.stringW
                  ? 'bg-emerald-950 text-emerald-300'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              Yield: "{d1Yield}"
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {value.leftDerivation1.map((step, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-slate-500 font-mono w-6 text-right font-bold">
                  {idx === 0 ? 'S' : '⇒'}
                </span>
                <input
                  type="text"
                  value={step}
                  onChange={(e) =>
                    handleDerivationChange('leftDerivation1', idx, e.target.value)
                  }
                  className="flex-1 bg-slate-900 border border-slate-800 text-emerald-300 font-mono p-1.5 rounded focus:border-emerald-500 focus:outline-none"
                />
                {value.leftDerivation1.length > 2 && (
                  <button
                    onClick={() => handleRemoveStep('leftDerivation1', idx)}
                    className="text-red-400 hover:text-red-300 px-1 font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={() => handleAddStep('leftDerivation1')}
            className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-sky-400 font-medium rounded border border-slate-800 text-xs transition"
          >
            + Add Derivation Step
          </button>
        </div>

        {/* Leftmost Derivation #2 */}
        <div className="flex flex-col gap-3 bg-slate-950 p-4 rounded-lg border border-slate-800">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="font-bold text-purple-400 font-mono">Derivation Path #2</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                d2Yield === value.stringW
                  ? 'bg-emerald-950 text-emerald-300'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              Yield: "{d2Yield}"
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {value.leftDerivation2.map((step, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-slate-500 font-mono w-6 text-right font-bold">
                  {idx === 0 ? 'S' : '⇒'}
                </span>
                <input
                  type="text"
                  value={step}
                  onChange={(e) =>
                    handleDerivationChange('leftDerivation2', idx, e.target.value)
                  }
                  className="flex-1 bg-slate-900 border border-slate-800 text-emerald-300 font-mono p-1.5 rounded focus:border-emerald-500 focus:outline-none"
                />
                {value.leftDerivation2.length > 2 && (
                  <button
                    onClick={() => handleRemoveStep('leftDerivation2', idx)}
                    className="text-red-400 hover:text-red-300 px-1 font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={() => handleAddStep('leftDerivation2')}
            className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-purple-400 font-medium rounded border border-slate-800 text-xs transition"
          >
            + Add Derivation Step
          </button>
        </div>
      </div>
    </div>
  );
};