import React from 'react';
import { VerificationResult } from '@/types/automata';

interface VerificationPanelProps {
  result: VerificationResult | null;
}

export const VerificationPanel: React.FC<VerificationPanelProps> = ({ result }) => {
  return (
    <div className="bg-steel-900 border border-steel-800 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-white mb-3">Verification & Score</h2>
      {!result ? (
        <p className="text-steel-500 text-sm italic">Execute solution to view automated grading diagnostics.</p>
      ) : (
        <div className="space-y-4">
          <div
            className={`p-4 rounded-lg text-sm border ${
              result.passed
                ? 'bg-gold-950/60 border-gold-500/50 text-gold-300'
                : 'bg-red-950/50 border-red-500/50 text-red-300'
            }`}
          >
            <div className="font-bold flex justify-between items-center">
              <span>{result.passed ? '✓ Solution Verified' : '✗ Verification Failed'}</span>
              <span className="text-xs bg-steel-950 px-2 py-0.5 rounded border border-steel-800 font-mono">
                Score: {(result.score * 100).toFixed(0)}%
              </span>
            </div>
            <p className="text-xs mt-2 leading-relaxed">{result.feedback}</p>
          </div>

          {result.testResults.length > 0 && (
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              <span className="text-xs text-steel-400">Test Case Diagnostics:</span>
              {result.testResults.map((res, idx) => (
                <div
                  key={idx}
                  className={`px-3 py-2 rounded border text-xs flex justify-between items-center ${
                    res.passed
                      ? 'bg-gold-950/30 border-gold-900/50 text-gold-300'
                      : 'bg-red-950/30 border-red-900/50 text-red-300'
                  }`}
                >
                  <span className="font-mono">&quot;{res.input}&quot;</span>
                  <span>{res.passed ? '✓ Passed' : '✗ Failed'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};