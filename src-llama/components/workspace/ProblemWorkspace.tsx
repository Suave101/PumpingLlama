'use client';

import React, { useState, useMemo } from 'react';
import {
  Problem,
  ProblemType,
  EditorMode,
  DFA,
  PDA,
  CFG,
  PumpingLemmaSubmission,
  AmbiguityProof,
  VerificationResult,
} from '@/types/automata';
import { evaluateSolution, grammarSpecToCFG } from '@/lib/logic';

import { WorkspaceHeader } from '@/components/workspace/WorkspaceHeader';
import { ModeSwitcher } from '@/components/workspace/ModeSwitcher';
import { VerificationPanel } from '@/components/workspace/VerificationPanel';
import { DFATable, GrammarCard } from '@/components/workspace/GivenMachines';

import { CanvasEditor } from '@/components/editors/CanvasEditor';
import { JsonEditor } from '@/components/editors/JsonEditor';
import { PdaCanvasEditor } from '@/components/editors/PdaCanvasEditor';
import { CfgEditor } from '@/components/editors/CfgEditor';
import { PumpingLemmaEditor } from '@/components/editors/PumpingLemmaEditor';
import { AmbiguityEditor } from '@/components/editors/AmbiguityEditor';
import { ParseTreeEditor } from '@/components/editors/ParseTreeEditor';
import { RegexEditor } from '@/components/editors/RegexEditor';

// Types whose problem statement includes a grammar the student works from
const GIVEN_GRAMMAR_TYPES: string[] = ['ambiguity-detection', 'parse-trees', 'cfg-to-cnf', 'cfg-to-gnf', 'cfg-to-pda'];
// Types whose answerDFA is the input to the exercise rather than the answer
const GIVEN_DFA_TYPES: string[] = ['dfa-to-regex'];

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
      return { defaultMode: 'cfg', allowedModes: ['cfg'] };

    case 'pumping-lemma':
      return { defaultMode: 'pumping', allowedModes: ['pumping'] };

    // The grammar is part of the problem, so there is no editable CFG tab
    case 'ambiguity-detection':
      return { defaultMode: 'ambiguity', allowedModes: ['ambiguity'] };

    case 'parse-trees':
      return { defaultMode: 'parse-tree', allowedModes: ['parse-tree'] };

    case 'dfa-to-regex':
    case 'regex-construction':
      return { defaultMode: 'regex', allowedModes: ['regex'] };

    default:
      return { defaultMode: 'canvas', allowedModes: ['canvas', 'json'] };
  }
}

const EPSILON_WORDS = ['ε', 'eps', 'epsilon', 'λ', 'lambda'];

function parseCFGText(text: string, alphabet: string[]): CFG {
  const rules = text
    .split('\n')
    .filter((l) => l.trim().length > 0)
    .map((line) => {
      const [lhs = '', rhsPart = ''] = line.split(/->|→|::=/).map((s) => s.trim());
      const rhs = rhsPart.split('|').map((s) => {
        const alt = s.trim();
        return EPSILON_WORDS.includes(alt.toLowerCase()) ? '' : alt;
      });
      return { lhs, rhs };
    });

  // Merge repeated left-hand sides (e.g. two "S -> ..." lines)
  const merged: CFG['rules'] = [];
  for (const r of rules) {
    const existing = merged.find((m) => m.lhs === r.lhs);
    if (existing) existing.rhs.push(...r.rhs);
    else merged.push({ lhs: r.lhs, rhs: [...r.rhs] });
  }

  return {
    variables: merged.map((r) => r.lhs),
    terminals: alphabet,
    rules: merged,
    startSymbol: merged[0]?.lhs || 'S',
  };
}

const errorResult = (feedback: string): VerificationResult => ({
  passed: false,
  score: 0,
  counterexample: null,
  testResults: [],
  feedback,
});

export type Submission = Parameters<typeof evaluateSolution>[0];

type ProblemWorkspaceProps = {
  problem: Problem;
  // Embedded in a textbook section: no page chrome, single column
  embedded?: boolean;
  onSubmit?: (submission: Submission, result: VerificationResult) => void;
};

export default function ProblemWorkspace({ problem, embedded = false, onSubmit }: ProblemWorkspaceProps) {
  const modeConfig = useMemo(() => getProblemModeConfig(problem.type), [problem.type]);
  const [editorMode, setEditorMode] = useState<EditorMode>(modeConfig.defaultMode);
  const machineIsPda = modeConfig.defaultMode === 'pda';

  const alphabet = useMemo(() => problem.alphabet || ['0', '1'], [problem.alphabet]);

  // Grammar the student works from (newer problem files keep it in answerCFG)
  const givenCFG = useMemo(() => {
    if (!GIVEN_GRAMMAR_TYPES.includes(problem.type)) return null;
    const spec = problem.givenCFG ?? problem.answerCFG;
    return spec ? grammarSpecToCFG(spec) : null;
  }, [problem.type, problem.givenCFG, problem.answerCFG]);
  const startSymbol = givenCFG?.startSymbol || 'S';
  const showGivenDFA = problem.answerDFA && GIVEN_DFA_TYPES.includes(problem.type);
  const targetString = problem.testCases.find((tc) => tc.expected)?.input ?? '';

  // Editor States (all start empty)
  const [dfaState, setDfaState] = useState<DFA>({
    states: [],
    alphabet,
    initialState: '',
    acceptStates: [],
    transitions: {},
  });
  const [pdaState, setPdaState] = useState<PDA>({
    states: [],
    alphabet,
    stackAlphabet: [],
    initialState: '',
    initialStackSymbol: '',
    acceptStates: [],
    acceptBy: 'final-state',
    transitions: [],
  });
  const [jsonText, setJsonText] = useState<string>('');
  const [cfgText, setCfgText] = useState<string>('');
  const [regexInput, setRegexInput] = useState<string>('');
  const [pumpingState, setPumpingState] = useState<PumpingLemmaSubmission>({ w: '' });
  const [ambiguityState, setAmbiguityState] = useState<AmbiguityProof>({
    stringW: '',
    leftDerivation1: ['', ''],
    leftDerivation2: ['', ''],
  });
  const [parseTreeInput, setParseTreeInput] = useState<string>(() =>
    JSON.stringify({ symbol: startSymbol }, null, 2)
  );

  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);

  // Keep the canvas and the raw JSON view in sync when switching between them
  const handleSelectMode = (mode: EditorMode) => {
    if (mode === 'json') {
      setJsonText(JSON.stringify(machineIsPda ? pdaState : dfaState, null, 2));
    } else if (editorMode === 'json') {
      try {
        const parsed = JSON.parse(jsonText);
        if (machineIsPda) setPdaState(parsed as PDA);
        else setDfaState(parsed as DFA);
      } catch {
        setVerificationResult(errorResult('Fix the JSON before switching back to the canvas.'));
        return;
      }
    }
    setEditorMode(mode);
  };

  const handleVerify = () => {
    const payload: Submission = {};

    if (editorMode === 'canvas' || editorMode === 'pda' || editorMode === 'json') {
      let machine: DFA | PDA = machineIsPda ? pdaState : dfaState;
      if (editorMode === 'json') {
        if (!jsonText.trim()) return setVerificationResult(errorResult('Enter a definition first.'));
        try {
          machine = JSON.parse(jsonText);
        } catch {
          return setVerificationResult(errorResult('Invalid JSON structure.'));
        }
      }
      if (!machine.states || machine.states.length === 0) {
        return setVerificationResult(errorResult('Add at least one state first.'));
      }
      if (machineIsPda) payload.pda = machine as PDA;
      else payload.dfa = machine as DFA;
    } else if (editorMode === 'regex') {
      payload.regex = regexInput;
    } else if (editorMode === 'cfg') {
      payload.cfg = parseCFGText(cfgText, alphabet);
    } else if (editorMode === 'pumping') {
      payload.pumping = pumpingState;
    } else if (editorMode === 'ambiguity' || editorMode === 'parse-tree') {
      if (!givenCFG) return setVerificationResult(errorResult('This problem does not define its grammar.'));
      payload.cfg = givenCFG;
      if (editorMode === 'ambiguity') {
        payload.ambiguity = ambiguityState;
      } else {
        try {
          payload.parseTree = { tree: JSON.parse(parseTreeInput), target: targetString };
        } catch {
          return setVerificationResult(errorResult('Invalid Parse Tree JSON structure.'));
        }
      }
    }

    const result = evaluateSolution(payload, problem);
    setVerificationResult(result);
    onSubmit?.(payload, result);
  };

  const body = (
    <div className={embedded ? 'flex flex-col gap-6' : 'grid grid-cols-1 lg:grid-cols-12 gap-8'}>
      <div className={embedded ? 'flex flex-col gap-6' : 'lg:col-span-7 flex flex-col gap-6'}>
        {givenCFG && <GrammarCard cfg={givenCFG} title="Given grammar" />}
        {showGivenDFA && <DFATable dfa={problem.answerDFA!} />}

        <ModeSwitcher
          allowedModes={modeConfig.allowedModes}
          currentMode={editorMode}
          onSelectMode={handleSelectMode}
        />

        {editorMode === 'canvas' && (
          <CanvasEditor alphabet={alphabet} dfa={dfaState} onChange={setDfaState} />
        )}
        {editorMode === 'pda' && <PdaCanvasEditor pda={pdaState} onChange={setPdaState} />}
        {editorMode === 'json' && <JsonEditor value={jsonText} onChange={setJsonText} />}
        {editorMode === 'cfg' && <CfgEditor value={cfgText} onChange={setCfgText} />}
        {editorMode === 'pumping' && (
          <PumpingLemmaEditor value={pumpingState} onChange={setPumpingState} />
        )}
        {editorMode === 'parse-tree' && (
          <ParseTreeEditor
            value={parseTreeInput}
            onChange={setParseTreeInput}
            targetString={targetString}
            startSymbol={startSymbol}
          />
        )}
        {editorMode === 'ambiguity' && (
          <AmbiguityEditor value={ambiguityState} onChange={setAmbiguityState} startSymbol={startSymbol} />
        )}
        {editorMode === 'regex' && <RegexEditor value={regexInput} onChange={setRegexInput} />}

        <button
          onClick={handleVerify}
          className="w-full bg-crimson-600 hover:bg-crimson-500 text-white font-medium py-3 rounded-lg transition shadow-lg"
        >
          Verify Solution & Run Evaluator
        </button>
      </div>

      <div className={embedded ? 'flex flex-col gap-6' : 'lg:col-span-5 flex flex-col gap-6'}>
        <VerificationPanel result={verificationResult} />
      </div>
    </div>
  );

  if (embedded) return body;

  return (
    <main className="min-h-screen bg-steel-950 text-steel-100 p-8 font-sans">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        <WorkspaceHeader problem={problem} />
        {body}
      </div>
    </main>
  );
}
