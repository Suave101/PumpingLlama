'use client';

import React from 'react';
import { AmbiguityProof } from '@/types/automata';

interface AmbiguityEditorProps {
  value: AmbiguityProof;
  onChange: (val: AmbiguityProof) => void;
  startSymbol?: string;
}

export const AmbiguityEditor: React.FC<AmbiguityEditorProps> = ({ value, onChange, startSymbol = 'S' }) => {
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
    const lastStep = currentList[currentList.length - 1] || '';
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
  // Only a quick shape check; whether each step is a real leftmost step is decided by the verifier
  const bothReachW =
    value.stringW.length > 0 &&
    d1Yield === value.stringW &&
    d2Yield === value.stringW &&
    isDistinct;

  return (
    <div className="flex flex-col gap-5 bg-steel-900 border border-steel-800 rounded-xl p-5">
      {/* Proof Status Header */}
      <div className="flex justify-between items-center bg-steel-950 p-3.5 rounded-lg border border-steel-800">
        <div>
          <h3 className="text-xs font-bold text-gold-400 uppercase tracking-wider">
            Ambiguity Proof Visualizer
          </h3>
          <p className="text-[11px] text-steel-400 mt-0.5">
            Demonstrate grammar ambiguity by finding 2 distinct leftmost derivations for string w.
          </p>
        </div>

        <div
          className={`px-3 py-1 rounded text-xs font-mono font-bold border ${
            bothReachW
              ? 'bg-gold-950/80 text-gold-300 border-gold-500/50'
              : 'bg-arc-950/80 text-arc-300 border-arc-500/50'
          }`}
        >
          {bothReachW ? '✓ Both derivations reach w' : '⚠ Incomplete Proof'}
        </div>
      </div>

      {/* Target String Input */}
      <div className="bg-steel-950 p-3 rounded-lg border border-steel-800 text-xs">
        <label className="text-steel-300 font-semibold block mb-1">Target String (w):</label>
        <input
          type="text"
          value={value.stringW}
          onChange={(e) => handleStringChange(e.target.value)}
          className="w-full bg-steel-900 border border-steel-700 text-gold-300 font-mono text-sm p-2 rounded focus:outline-none focus:border-gold-500"
        />
      </div>

      {/* Dual Pipeline Derivation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Leftmost Derivation #1 */}
        <div className="flex flex-col gap-3 bg-steel-950 p-4 rounded-lg border border-steel-800">
          <div className="flex justify-between items-center border-b border-steel-800 pb-2">
            <span className="font-bold text-arc-400 font-mono">Derivation Path #1</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                d1Yield === value.stringW
                  ? 'bg-gold-950 text-gold-300'
                  : 'bg-steel-800 text-steel-400'
              }`}
            >
              Yield: &quot;{d1Yield}&quot;
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {value.leftDerivation1.map((step, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-steel-500 font-mono w-6 text-right font-bold">
                  {idx === 0 ? '' : '⇒'}
                </span>
                <input
                  type="text"
                  value={step}
                  aria-label={`Derivation 1 step ${idx + 1}`}
                  placeholder={idx === 0 ? `start with ${startSymbol}` : undefined}
                  onChange={(e) =>
                    handleDerivationChange('leftDerivation1', idx, e.target.value)
                  }
                  className="flex-1 bg-steel-900 border border-steel-800 text-gold-300 font-mono p-1.5 rounded focus:border-gold-500 focus:outline-none"
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
            className="w-full py-1.5 bg-steel-900 hover:bg-steel-800 text-arc-400 font-medium rounded border border-steel-800 text-xs transition"
          >
            + Add Derivation Step
          </button>
        </div>

        {/* Leftmost Derivation #2 */}
        <div className="flex flex-col gap-3 bg-steel-950 p-4 rounded-lg border border-steel-800">
          <div className="flex justify-between items-center border-b border-steel-800 pb-2">
            <span className="font-bold text-crimson-400 font-mono">Derivation Path #2</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                d2Yield === value.stringW
                  ? 'bg-gold-950 text-gold-300'
                  : 'bg-steel-800 text-steel-400'
              }`}
            >
              Yield: &quot;{d2Yield}&quot;
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {value.leftDerivation2.map((step, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-steel-500 font-mono w-6 text-right font-bold">
                  {idx === 0 ? '' : '⇒'}
                </span>
                <input
                  type="text"
                  value={step}
                  aria-label={`Derivation 2 step ${idx + 1}`}
                  placeholder={idx === 0 ? `start with ${startSymbol}` : undefined}
                  onChange={(e) =>
                    handleDerivationChange('leftDerivation2', idx, e.target.value)
                  }
                  className="flex-1 bg-steel-900 border border-steel-800 text-gold-300 font-mono p-1.5 rounded focus:border-gold-500 focus:outline-none"
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
            className="w-full py-1.5 bg-steel-900 hover:bg-steel-800 text-crimson-400 font-medium rounded border border-steel-800 text-xs transition"
          >
            + Add Derivation Step
          </button>
        </div>
      </div>
    </div>
  );
};