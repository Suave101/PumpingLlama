'use client';

import React, { useState } from 'react';
import { ParseTreeNode } from '@/types/automata';

export type EditableNode = {
  id: number;
  symbol: string;
  children: EditableNode[];
};

export function makeNode(symbol: string, id = 0): EditableNode {
  return { id, symbol, children: [] };
}

function maxId(node: EditableNode): number {
  return Math.max(node.id, ...node.children.map(maxId));
}

export function toParseTree(node: EditableNode): ParseTreeNode {
  return { symbol: node.symbol.trim(), children: node.children.map(toParseTree) };
}

function updateNode(node: EditableNode, id: number, fn: (n: EditableNode) => EditableNode): EditableNode {
  if (node.id === id) return fn(node);
  return { ...node, children: node.children.map((c) => updateNode(c, id, fn)) };
}

function removeNode(node: EditableNode, id: number): EditableNode {
  return { ...node, children: node.children.filter((c) => c.id !== id).map((c) => removeNode(c, id)) };
}

export default function ParseTreeEditor({
  root,
  onChange,
}: {
  root: EditableNode;
  onChange: (root: EditableNode) => void;
}) {
  const [selectedId, setSelectedId] = useState<number>(root.id);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState('');

  const startEditing = (node: EditableNode) => {
    setSelectedId(node.id);
    setEditingId(node.id);
    setDraft(node.symbol);
  };

  const commitEdit = () => {
    if (editingId === null) return;
    onChange(updateNode(root, editingId, (n) => ({ ...n, symbol: draft.trim() })));
    setEditingId(null);
  };

  const addChild = () => {
    const child = makeNode('', maxId(root) + 1);
    onChange(updateNode(root, selectedId, (n) => ({ ...n, children: [...n.children, child] })));
    startEditing(child);
  };

  const removeSelected = () => {
    if (selectedId === root.id) return;
    onChange(removeNode(root, selectedId));
    setSelectedId(root.id);
  };

  const renderNode = (node: EditableNode): React.ReactNode => {
    const selected = node.id === selectedId;
    const editing = node.id === editingId;
    return (
      <li key={node.id}>
        {editing ? (
          <input
            autoFocus
            onFocus={(e) => e.target.select()}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitEdit();
              if (e.key === 'Escape') setEditingId(null);
            }}
            aria-label="Node symbol"
            className="w-14 h-10 rounded-full text-center font-mono text-sm bg-slate-950 border-2 border-emerald-400 text-white focus:outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => setSelectedId(node.id)}
            onDoubleClick={() => startEditing(node)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === 'F2') {
                e.preventDefault();
                startEditing(node);
              }
              if ((e.key === 'Delete' || e.key === 'Backspace') && node.id !== root.id) {
                e.preventDefault();
                onChange(removeNode(root, node.id));
                setSelectedId(root.id);
              }
            }}
            title="Double-click to edit"
            className={`min-w-10 h-10 px-3 rounded-full font-mono text-sm border-2 transition ${
              selected
                ? 'border-emerald-400 bg-emerald-950 text-emerald-200'
                : 'border-slate-600 bg-slate-900 text-slate-100 hover:border-slate-400'
            }`}
          >
            {node.symbol || <span className="text-slate-500">?</span>}
          </button>
        )}
        {node.children.length > 0 && <ul>{node.children.map(renderNode)}</ul>}
      </li>
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-xs">
        <button
          type="button"
          onClick={addChild}
          className="whitespace-nowrap px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-100"
        >
          + Add child
        </button>
        <button
          type="button"
          onClick={removeSelected}
          disabled={selectedId === root.id}
          className="whitespace-nowrap px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-100 disabled:opacity-40 disabled:hover:bg-slate-800"
        >
          Remove node
        </button>
        <span className="text-slate-500">
          Click a node to select it, double-click to edit its symbol. Use ε for an empty leaf.
        </span>
      </div>
      <div className="ptree overflow-x-auto bg-slate-900 border border-slate-800 rounded-lg p-6">
        <ul>{renderNode(root)}</ul>
      </div>
    </div>
  );
}
