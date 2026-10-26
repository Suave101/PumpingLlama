'use client';

import React, { useState, useMemo } from 'react';
import { ParseTreeNode } from '@/types/automata';

interface ParseTreeEditorProps {
  value: string;
  onChange: (val: string) => void;
  targetString?: string;
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
}) => {
  const [viewMode, setViewMode] = useState<'visual' | 'json'>('visual');

  // Parse JSON string into ParseTreeNode
  const parsedTree = useMemo<ParseTreeNode>(() => {
    try {
      return JSON.parse(value);
    } catch {
      return { symbol: 'S', children: [{ symbol: 'a' }, { symbol: 'b' }] };
    }
  }, [value]);

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
    curr.children.push({ symbol: 'a' });
    updateTree(treeCopy);
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
          stroke="#475569"
          strokeWidth="2"
        />
      );
      elements.push(...renderSvgElements(child, [...path, idx]));
    });

    // Node Style
    const isEpsilon = node.node.symbol === 'ε';
    const bgFill = isEpsilon
      ? '#581c87'
      : isTerminal
      ? '#064e3b'
      : '#0f172a';
    const strokeColor = isEpsilon
      ? '#c084fc'
      : isTerminal
      ? '#34d399'
      : '#38bdf8';

    elements.push(
      <g
        key={`node-${node.id}`}
        transform={`translate(${node.x}, ${node.y})`}
        className="group cursor-pointer"
      >
        <circle
          r="18"
          fill={bgFill}
          stroke={strokeColor}
          strokeWidth="2"
          className="transition hover:scale-110"
        />
        <text
          fill="#ffffff"
          fontSize="11"
          fontWeight="bold"
          textAnchor="middle"
          dy="4"
          className="font-mono pointer-events-none select-none"
        >
          {node.node.symbol}
        </text>

        {/* Quick Node Actions Overlay */}
        <foreignObject x="-35" y="20" width="70" height="30" className="opacity-0 group-hover:opacity-100 transition">
          <div className="flex justify-center gap-1 bg-slate-900/90 border border-slate-700 rounded p-0.5 shadow">
            <button
              onClick={() => {
                const sym = prompt('Enter new symbol:', node.node.symbol);
                if (sym !== null) handleEditSymbol(path, sym);
              }}
              className="text-[10px] text-sky-400 hover:text-sky-300 font-bold px-1"
              title="Edit Symbol"
            >
              ✎
            </button>
            <button
              onClick={() => handleAddChild(path)}
              className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold px-1"
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
    <div className="flex flex-col gap-4 bg-slate-900 border border-slate-800 rounded-xl p-5">
      {/* Header Controls */}
      <div className="flex justify-between items-center bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
        <div className="flex items-center gap-3">
          <span className="text-slate-400 font-semibold uppercase tracking-wider">
            Parse Tree Builder
          </span>
          <div className="flex gap-1 bg-slate-900 p-0.5 rounded border border-slate-800">
            <button
              onClick={() => setViewMode('visual')}
              className={`px-2.5 py-1 rounded text-xs ${
                viewMode === 'visual'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Visual Tree
            </button>
            <button
              onClick={() => setViewMode('json')}
              className={`px-2.5 py-1 rounded text-xs ${
                viewMode === 'json'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              JSON Structure
            </button>
          </div>
        </div>

        {/* Tree Derived Yield Badge */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Tree Yield:</span>
          <span className="font-mono font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 px-2.5 py-0.5 rounded">
            "{leaves}"
          </span>
          {targetString && (
            <span
              className={`text-[11px] px-2 py-0.5 rounded font-mono ${
                leaves === targetString
                  ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-800'
                  : 'bg-amber-950/60 text-amber-300 border border-amber-800'
              }`}
            >
              {leaves === targetString ? '✓ Matches Target' : `Target: "${targetString}"`}
            </span>
          )}
        </div>
      </div>

      {/* Visual Mode */}
      {viewMode === 'visual' && (
        <div className="relative w-full min-h-[300px] max-h-[420px] bg-slate-950 border border-slate-800 rounded-lg overflow-auto p-4 flex justify-center items-center">
          <svg width={width} height={height} className="select-none">
            {renderSvgElements(positionedRoot)}
          </svg>
        </div>
      )}

      {/* JSON Mode */}
      {viewMode === 'json' && (
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-slate-300">
            Parse Tree Hierarchy (JSON format):
          </label>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={12}
            className="w-full bg-slate-950 font-mono text-xs p-4 rounded-lg border border-slate-800 text-emerald-300 focus:outline-none focus:border-emerald-500"
          />
        </div>
      )}
    </div>
  );
};