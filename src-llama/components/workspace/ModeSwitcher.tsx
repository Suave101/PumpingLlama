import React from 'react';
import { EditorMode } from '@/types/automata';

interface ModeSwitcherProps {
  allowedModes: EditorMode[];
  currentMode: EditorMode;
  onSelectMode: (mode: EditorMode) => void;
}

export const ModeSwitcher: React.FC<ModeSwitcherProps> = ({
  allowedModes,
  currentMode,
  onSelectMode,
}) => {
  if (allowedModes.length <= 1) return null;

  return (
    <div className="flex justify-between items-center bg-steel-900 p-2 rounded-lg border border-steel-800">
      <span className="text-xs text-steel-400 pl-2">Editor Mode:</span>
      <div className="flex gap-1">
        {allowedModes.map((mode) => (
          <button
            key={mode}
            onClick={() => onSelectMode(mode)}
            className={`px-3 py-1 rounded text-xs font-medium uppercase ${
              currentMode === mode ? 'bg-crimson-600 text-white' : 'text-steel-400 hover:text-white'
            }`}
          >
            {mode}
          </button>
        ))}
      </div>
    </div>
  );
};