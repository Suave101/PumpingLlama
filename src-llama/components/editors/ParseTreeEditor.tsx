'use client';

import React, { useState, useMemo } from 'react';
import { ParseTreeNode } from '@/types/automata';

interface ParseTreeEditorProps {
  value: string;
  onChange: (val: string) => void;
  targetString?: string;
  startSymbol?: string;
}

interface PositionedNode {
  node: ParseTreeNode;
  id: string;
  x: number;
  y: number;
  children: PositionedNode[];
}

export const ParseTreeEditor: React.FC<ParseTreeEditorProps> = ({
  value,
  onChange,
  targetString,
  startSymbol = 'S',
}) => {
  const [viewMode, setViewMode] = useState<'visual' | 'json'>('visual');
  // Path of the node whose symbol is being edited inline, e.g. "0.1"; null when not editing
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  // Parse JSON string into ParseTreeNode
  const parsedTree = useMemo<ParseTreeNode>(() => {
    try {
      return JSON.parse(value);
    } catch {
      return { symbol: startSymbol };
    }
  }, [value, startSymbol]);

  const updateTree = (newTree: ParseTreeNode) => {
    onChange(JSON.stringify(newTree, null, 2));
  };

  // 1. Recursive Layout Engine for SVG Tree Rendering
  const { positionedRoot, width, height, leaves } = useMemo(() => {
    let nextId = 0;
    const leafXCounter = { current: 0 };
    const levelHeight = 60;
    const nodeSpacing = 50;
    const leavesList: string[] = [];

    function layout(node: ParseTreeNode, depth: number): PositionedNode {
      const id = `node-${nextId++}`;
      const isLeaf = !node.children || node.children.length === 0;

      if (isLeaf) {
        const x = leafXCounter.current * nodeSpacing + 40;
        leafXCounter.current += 1;
        if (node.symbol !== 'ε') {
          leavesList.push(node.symbol);
        }
        return {
          node,
          id,
          x,
          y: depth * levelHeight + 40,
          children: [],
        };
      }

      const childNodes = node.children!.map((child) => layout(child, depth + 1));
      const firstChildX = childNodes[0].x;
      const lastChildX = childNodes[childNodes.length - 1].x;
      const x = (firstChildX + lastChildX) / 2;

      return {
        node,
        id,
        x,
        y: depth * levelHeight + 40,
        children: childNodes,
      };
    }

    const root = layout(parsedTree, 0);
    const totalWidth = Math.max(400, leafXCounter.current * nodeSpacing + 80);
    const getMaxDepth = (n: PositionedNode): number =>
      n.children.length === 0 ? n.y : Math.max(...n.children.map(getMaxDepth));

    const totalHeight = getMaxDepth(root) + 60;

    return {
      positionedRoot: root,
      width: totalWidth,
      height: totalHeight,
      leaves: leavesList.join(''),
    };
  }, [parsedTree]);

  // Tree Manipulation Helpers
  const handleAddChild = (parentPath: number[]) => {
    const treeCopy = JSON.parse(JSON.stringify(parsedTree));
    let curr = treeCopy;
    for (const idx of parentPath) {
      curr = curr.children[idx];
    }
    if (!curr.children) curr.children = [];
    curr.children.push({ symbol: '' });
    updateTree(treeCopy);
    startEditing([...parentPath, curr.children.length - 1], '');
  };

  const startEditing = (path: number[], symbol: string) => {
    setEditingKey(path.join('.'));
    setDraft(symbol);
  };

  const commitEdit = (path: number[]) => {
    handleEditSymbol(path, draft.trim());
    setEditingKey(null);
  };

  const handleEditSymbol = (parentPath: number[], newSymbol: string) => {
    const treeCopy = JSON.parse(JSON.stringify(parsedTree));
    let curr = treeCopy;
    for (const idx of parentPath) {
      curr = curr.children[idx];
    }
    curr.symbol = newSymbol;
    updateTree(treeCopy);
  };

  const handleDeleteNode = (parentPath: number[]) => {
    if (parentPath.length === 0) return; // Cannot delete root
    const treeCopy = JSON.parse(JSON.stringify(parsedTree));
    let curr = treeCopy;
    for (let i = 0; i < parentPath.length - 1; i++) {
      curr = curr.children[parentPath[i]];
    }
    const removeIdx = parentPath[parentPath.length - 1];
    curr.children.splice(removeIdx, 1);
    if (curr.children.length === 0) delete curr.children;
    updateTree(treeCopy);
  };

  // Recursive Tree Lines & Nodes SVG Generator
  const renderSvgElements = (
    node: PositionedNode,
    path: number[] = []
  ): React.ReactNode[] => {
    const elements: React.ReactNode[] = [];
    const isTerminal = !node.node.children || node.node.children.length === 0;

    // Render Branch Lines to Children
    node.children.forEach((child, idx) => {
      elements.push(
        <line
          key={`line-${node.id}-${child.id}`}
          x1={node.x}
          y1={node.y}
          x2={child.x}
          y2={child.y}
          stroke="#535962"
          strokeWidth="2"
        />
      );
      elements.push(...renderSvgElements(child, [...path, idx]));
    });

    // Node Style
    const isEpsilon = node.node.symbol === 'ε';
    const bgFill = isEpsilon
      ? '#4d0d17'
      : isTerminal
      ? '#4a3210'
      : '#1a1c21';
    const strokeColor = isEpsilon
      ? '#df5468'
      : isTerminal
      ? '#f0b72f'
      : '#4fe3ea';

    const isEditing = editingKey === path.join('.');

    elements.push(
      <g
        key={`node-${node.id}`}
        transform={`translate(${node.x}, ${node.y})`}
        className="group cursor-pointer"
        onDoubleClick={() => startEditing(path, node.node.symbol)}
      >
        <title>Double-click to edit</title>
        <circle
          r="18"
          fill={bgFill}
          stroke={isEditing ? '#f0b72f' : strokeColor}
          strokeWidth="2"
          className="transition hover:scale-110"
        />
        {isEditing ? (
          <foreignObject x="-17" y="-11" width="34" height="22">
            <input
              autoFocus
              onFocus={(e) => e.target.select()}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => commitEdit(path)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitEdit(path);
                if (e.key === 'Escape') setEditingKey(null);
              }}
              aria-label="Node symbol"
              className="w-full h-full bg-transparent text-center text-white font-mono text-[11px] font-bold focus:outline-none"
            />
          </foreignObject>
        ) : (
          <text
            fill={node.node.symbol ? '#ffffff' : '#69707a'}
            fontSize="11"
            fontWeight="bold"
            textAnchor="middle"
            dy="4"
            className="font-mono pointer-events-none select-none"
          >
            {node.node.symbol || '?'}
          </text>
        )}

        {/* Quick Node Actions Overlay */}
        <foreignObject x="-35" y="20" width="70" height="30" className="opacity-0 group-hover:opacity-100 transition">
          <div className="flex justify-center gap-1 bg-steel-900/90 border border-steel-700 rounded p-0.5 shadow">
            <button
              onClick={() => startEditing(path, node.node.symbol)}
              className="text-[10px] text-arc-400 hover:text-arc-300 font-bold px-1"
              title="Edit Symbol"
            >
              ✎
            </button>
            <button
              onClick={() => handleAddChild(path)}
              className="text-[10px] text-gold-400 hover:text-gold-300 font-bold px-1"
              title="Add Child Node"
            >
              +
            </button>
            {path.length > 0 && (
              <button
                onClick={() => handleDeleteNode(path)}
                className="text-[10px] text-red-400 hover:text-red-300 font-bold px-1"
                title="Delete Node"
              >
                ✕
              </button>
            )}
          </div>
        </foreignObject>
      </g>
    );

    return elements;
  };

  return (
    <div className="flex flex-col gap-4 bg-steel-900 border border-steel-800 rounded-xl p-5">
      {/* Header Controls */}
      <div className="flex justify-between items-center bg-steel-950 p-3 rounded-lg border border-steel-800 text-xs">
        <div className="flex items-center gap-3">
          <span className="text-steel-400 font-semibold uppercase tracking-wider">
            Parse Tree Builder
          </span>
          <div className="flex gap-1 bg-steel-900 p-0.5 rounded border border-steel-800">
            <button
              onClick={() => setViewMode('visual')}
              className={`px-2.5 py-1 rounded text-xs ${
                viewMode === 'visual'
                  ? 'bg-crimson-600 text-white font-bold'
                  : 'text-steel-400 hover:text-white'
              }`}
            >
              Visual Tree
            </button>
            <button
              onClick={() => setViewMode('json')}
              className={`px-2.5 py-1 rounded text-xs ${
                viewMode === 'json'
                  ? 'bg-crimson-600 text-white font-bold'
                  : 'text-steel-400 hover:text-white'
              }`}
            >
              JSON Structure
            </button>
          </div>
        </div>

        {/* Tree Derived Yield Badge */}
        <div className="flex items-center gap-2">
          <span className="text-steel-400">Tree Yield:</span>
          <span className="font-mono font-bold text-gold-300 bg-gold-950/60 border border-gold-500/40 px-2.5 py-0.5 rounded">
            &quot;{leaves}&quot;
          </span>
          {targetString && (
            <span
              className={`text-[11px] px-2 py-0.5 rounded font-mono ${
                leaves === targetString
                  ? 'bg-gold-900/60 text-gold-300 border border-gold-800'
                  : 'bg-arc-950/60 text-arc-300 border border-arc-800'
              }`}
            >
              {leaves === targetString ? '✓ Yield matches target' : `Target: "${targetString}"`}
            </span>
          )}
        </div>
      </div>

      {/* Visual Mode */}
      {viewMode === 'visual' && (
        <div className="relative w-full min-h-[300px] max-h-[420px] bg-steel-950 border border-steel-800 rounded-lg overflow-auto p-4 flex justify-center items-center">
          <svg width={width} height={height} className="select-none">
            {renderSvgElements(positionedRoot)}
          </svg>
        </div>
      )}

      {/* JSON Mode */}
      {viewMode === 'json' && (
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-steel-300">
            Parse Tree Hierarchy (JSON format):
          </label>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={12}
            className="w-full bg-steel-950 font-mono text-xs p-4 rounded-lg border border-steel-800 text-gold-300 focus:outline-none focus:border-gold-500"
          />
        </div>
      )}
    </div>
  );
};