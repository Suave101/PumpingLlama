import React from 'react';

interface JsonEditorProps {
  value: string;
  onChange: (val: string) => void;
}

export const JsonEditor: React.FC<JsonEditorProps> = ({ value, onChange }) => {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold text-steel-300">
        Automaton Definition (Raw JSON Format):
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={14}
        className="w-full bg-steel-900 font-mono text-xs p-4 rounded-lg border border-steel-800 text-gold-300 focus:outline-none focus:border-gold-500"
      />
    </div>
  );
};