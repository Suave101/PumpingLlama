import React from 'react';

interface RegexEditorProps {
  value: string;
  onChange: (val: string) => void;
}

export const RegexEditor: React.FC<RegexEditorProps> = ({ value, onChange }) => {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold text-slate-300">
        Regular Expression Input:
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. (a|b)*abb"
        className="w-full bg-slate-900 font-mono text-sm p-4 rounded-lg border border-slate-800 text-emerald-300 focus:outline-none focus:border-emerald-500 font-mono"
      />
    </div>
  );
};