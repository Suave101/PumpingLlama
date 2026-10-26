import React from 'react';

interface CfgEditorProps {
  value: string;
  onChange: (val: string) => void;
}

export const CfgEditor: React.FC<CfgEditorProps> = ({ value, onChange }) => {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold text-slate-300">
        Grammar Production Rules (e.g. S -&gt; A B | a):
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={10}
        className="w-full bg-slate-900 font-mono text-sm p-4 rounded-lg border border-slate-800 text-emerald-300 focus:outline-none focus:border-emerald-500"
      />
    </div>
  );
};