import React from 'react';

interface CfgEditorProps {
  value: string;
  onChange: (val: string) => void;
}

export const CfgEditor: React.FC<CfgEditorProps> = ({ value, onChange }) => {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="cfg-text" className="text-xs font-semibold text-slate-300">
        Grammar Production Rules, one variable per line (format: S -&gt; aSb | ε). The first line&apos;s variable
        is the start symbol.
      </label>
      <textarea
        id="cfg-text"
        spellCheck={false}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={10}
        className="w-full bg-slate-900 font-mono text-sm p-4 rounded-lg border border-slate-800 text-emerald-300 focus:outline-none focus:border-emerald-500"
      />
    </div>
  );
};