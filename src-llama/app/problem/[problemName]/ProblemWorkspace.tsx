'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Problem,
  ProblemType,
  DFA,
  PDA,
  CFG,
  PumpingLemmaSubmission,
  AmbiguityProof,
  VerificationResult,
} from '@/types/automata';
import { evaluateSolution } from '@/lib/logic';

import { WorkspaceHeader } from '@/components/workspace/WorkspaceHeader';
import { ModeSwitcher } from '@/components/workspace/ModeSwitcher';
import { VerificationPanel } from '@/components/workspace/VerificationPanel';

import { CanvasEditor } from '@/components/editors/CanvasEditor';
import { JsonEditor } from '@/components/editors/JsonEditor';
import { PdaCanvasEditor } from '@/components/editors/PdaCanvasEditor';
import { CfgEditor } from '@/components/editors/CfgEditor';
import { PumpingLemmaEditor } from '@/components/editors/PumpingLemmaEditor';
import { AmbiguityEditor } from '@/components/editors/AmbiguityEditor';
import { ParseTreeEditor } from '@/components/editors/ParseTreeEditor';
import { RegexEditor } from '@/components/editors/RegexEditor';

export type EditorMode =
  | 'canvas'
  | 'regex'
  | 'cfg'
  | 'pda'
  | 'pumping'
  | 'ambiguity'
  | 'parse-tree'
  | 'json';

function getProblemModeConfig(type: ProblemType | string): {
  defaultMode: EditorMode;
  allowedModes: EditorMode[];
} {
  const normalizedType = type.toLowerCase();

  switch (normalizedType) {
    case 'dfa-design':
    case 'dfa-construction':
    case 'nfa-design':
    case 'nfa-construction':
    case 'nfa-to-dfa':
    case 'dfa-minimization':
    case 'regex-to-dfa':
      return { defaultMode: 'canvas', allowedModes: ['canvas', 'json'] };

    case 'pda-construction':
    case 'pda-design':
    case 'cfg-to-pda':
      return { defaultMode: 'pda', allowedModes: ['pda', 'json'] };

    case 'cfg-to-gnf':
    case 'cfg-to-cnf':
    case 'cfg-construction':
    case 'cfg-design':
      return { defaultMode: 'cfg', allowedModes: ['cfg', 'json'] };

    case 'pumping-lemma':
      return { defaultMode: 'pumping', allowedModes: ['pumping'] };

    case 'ambiguity-detection':
      return { defaultMode: 'ambiguity', allowedModes: ['ambiguity', 'cfg'] };

    case 'parse-trees':
      return { defaultMode: 'parse-tree', allowedModes: ['parse-tree', 'cfg'] };

    case 'dfa-to-regex':
    case 'regex-construction':
      return { defaultMode: 'regex', allowedModes: ['regex'] };

    default:
      return { defaultMode: 'canvas', allowedModes: ['canvas', 'json'] };
  }
}

export default function ProblemWorkspace({ problem }: { problem: Problem }) {
  const modeConfig = useMemo(() => getProblemModeConfig(problem.type), [problem.type]);
  const [editorMode, setEditorMode] = useState<EditorMode>(modeConfig.defaultMode);

  useEffect(() => {
    setEditorMode(modeConfig.defaultMode);
  }, [problem.id, modeConfig]);

  const alphabet = problem.alphabet || ['0', '1'];

  // 1. DFA State
  const [dfaState, setDfaState] = useState<DFA>({
    states: ['q0', 'q1', 'q2', 'q3'],
    alphabet,
    initialState: 'q0',
    acceptStates: ['q0'],
    transitions: {
      q0: { '0': 'q1', '1': 'q2' },
      q1: { '0': 'q0', '1': 'q3' },
      q2: { '0': 'q3', '1': 'q0' },
      q3: { '0': 'q2', '1': 'q1' },
    },
  });

  // 2. PDA State
  const [pdaState, setPdaState] = useState<PDA>({
    states: ['q0', 'q1', 'q2'],
    alphabet,
    stackAlphabet: ['Z0', '0', '1'],
    initialState: 'q0',
    initialStackSymbol: 'Z0',
    acceptStates: ['q2'],
    acceptBy: 'final-state',
    transitions: [
      { from: 'q0', to: 'q0', inputSymbol: '0', popSymbol: 'Z0', pushSymbols: ['0', 'Z0'] },
      { from: 'q0', to: 'q1', inputSymbol: '1', popSymbol: '0', pushSymbols: [] },
      { from: 'q1', to: 'q2', inputSymbol: '', popSymbol: 'Z0', pushSymbols: ['Z0'] },
    ],
  });

  // 3. Raw JSON View State
  const [jsonText, setJsonText] = useState<string>('');

  // Keep JSON view text updated when switching into 'json' mode or updating states
  useEffect(() => {
    if (editorMode === 'pda') {
      setJsonText(JSON.stringify(pdaState, null, 2));
    } else if (editorMode === 'canvas') {
      setJsonText(JSON.stringify(dfaState, null, 2));
    }
  }, [editorMode]);

  const handleDfaChange = (updatedDfa: DFA) => {
    setDfaState(updatedDfa);
    setJsonText(JSON.stringify(updatedDfa, null, 2));
  };

  const handlePdaChange = (updatedPda: PDA) => {
    setPdaState(updatedPda);
    setJsonText(JSON.stringify(updatedPda, null, 2));
  };

  // Other Problem Type States
  const [cfgText, setCfgText] = useState<string>('S -> A B | a\nA -> a\nB -> b');
  const [regexInput, setRegexInput] = useState<string>('');

  const [pumpingState, setPumpingState] = useState<PumpingLemmaSubmission>({
    p: 4,
    w: 'aaaabbbb',
    u: 'aa',
    v: 'aa',
    x: '',
    y: 'bb',
    z: 'bb',
    i: 0,
  });

  const [ambiguityState, setAmbiguityState] = useState<AmbiguityProof>({
    stringW: 'a+a*a',
    leftDerivation1: ['E', 'E+E', 'a+E', 'a+E*E', 'a+a*E', 'a+a*a'],
    leftDerivation2: ['E', 'E*E', 'E+E*E', 'a+E*E', 'a+a*E', 'a+a*a'],
  });

  const [parseTreeInput, setParseTreeInput] = useState<string>(
    JSON.stringify({ symbol: 'S', children: [{ symbol: 'a' }, { symbol: 'b' }] }, null, 2)
  );

  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);

  const parseCFGInput = (): CFG => {
    const lines = cfgText.split('\n').filter((l) => l.trim().length > 0);
    const rules = lines.map((line) => {
      const parts = line.split(/->|::=/).map((s) => s.trim());
      const lhs = parts[0] || 'S';
      const rhsPart = parts[1] || '';
      const rhs = rhsPart.split('|').map((s) => s.trim());
      return { lhs, rhs };
    });

    return {
      variables: Array.from(new Set(rules.map((r) => r.lhs))),
      terminals: alphabet,
      rules,
      startSymbol: rules[0]?.lhs || 'S',
    };
  };

  const handleVerify = () => {
    const payload: Parameters<typeof evaluateSolution>[0] = {};

    if (editorMode === 'canvas') {
      payload.dfa = dfaState;
    } else if (editorMode === 'pda') {
      payload.pda = pdaState;
    } else if (editorMode === 'json') {
      try {
        const parsed = JSON.parse(jsonText);
        if ('stackAlphabet' in parsed || modeConfig.defaultMode === 'pda') {
          payload.pda = parsed as PDA;
        } else {
          payload.dfa = parsed as DFA;
        }
      } catch {
        alert('Invalid JSON structure.');
        return;
      }
    } else if (editorMode === 'cfg') {
      payload.cfg = parseCFGInput();
    } else if (editorMode === 'pumping') {
      payload.pumping = pumpingState;
    } else if (editorMode === 'ambiguity') {
      payload.ambiguity = ambiguityState;
      payload.cfg = parseCFGInput();
    } else if (editorMode === 'parse-tree') {
      try {
        const parsedTree =
          typeof parseTreeInput === 'string'
            ? JSON.parse(parseTreeInput)
            : parseTreeInput;
      
        payload.parseTree = {
          tree: parsedTree,
          target: problem.testCases[0]?.input || 'ab',
        };
        // Prefer the problem's defined reference grammar over temporary editor state
        payload.cfg = problem.answerCFG || parseCFGInput();
      } catch {
        alert('Invalid Parse Tree JSON structure.');
        return;
      }
    }

    const dummyDFA = problem.answerDFA || {
      states: [],
      alphabet,
      transitions: {},
      initialState: '',
      acceptStates: [],
    };

    const result = evaluateSolution(payload, dummyDFA, problem.testCases, problem.type);
    setVerificationResult(result);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        <WorkspaceHeader problem={problem} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 flex flex-col gap-6">
            <ModeSwitcher
              allowedModes={modeConfig.allowedModes}
              currentMode={editorMode}
              onSelectMode={setEditorMode}
            />

            {editorMode === 'canvas' && (
              <CanvasEditor alphabet={alphabet} dfa={dfaState} onChange={handleDfaChange} />
            )}
            {editorMode === 'pda' && (
              <PdaCanvasEditor pda={pdaState} onChange={handlePdaChange} />
            )}
            {editorMode === 'json' && <JsonEditor value={jsonText} onChange={setJsonText} />}
            {editorMode === 'cfg' && <CfgEditor value={cfgText} onChange={setCfgText} />}
            {editorMode === 'pumping' && (
              <PumpingLemmaEditor value={pumpingState} onChange={setPumpingState} />
            )}
            {editorMode === 'parse-tree' && (
              <ParseTreeEditor
                value={parseTreeInput}
                onChange={setParseTreeInput}
                targetString={problem.testCases[0]?.input}
              />
            )}
            
            {editorMode === 'ambiguity' && (
              <AmbiguityEditor value={ambiguityState} onChange={setAmbiguityState} />
            )}
            {editorMode === 'regex' && <RegexEditor value={regexInput} onChange={setRegexInput} />}

            <button
              onClick={handleVerify}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-lg transition shadow-lg"
            >
              Verify Solution & Run Evaluator
            </button>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-6">
            <VerificationPanel result={verificationResult} />
          </div>
        </div>
      </div>
    </main>
  );
}