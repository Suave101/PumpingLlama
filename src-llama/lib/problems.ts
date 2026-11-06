import fs from 'fs';
import path from 'path';
import { Problem } from '@/types/automata';

export type CategoryMeta = { title: string; description: string; icon: string };

// Display order on the homepage and the problem list
export const CATEGORY_ORDER = ['DFA', 'NFA', 'REGEX', 'CFG', 'NORMAL_FORMS', 'PDA', 'PARSING', 'PROOFS'];

export const CATEGORY_META: Record<string, CategoryMeta> = {
  DFA: {
    title: 'Deterministic Finite Automata',
    description: 'Construct state machines with deterministic transitions for regular languages.',
    icon: '⚡',
  },
  NFA: {
    title: 'Nondeterministic Finite Automata',
    description: 'Design non-deterministic state models featuring non-deterministic branches & ε-transitions.',
    icon: '🔀',
  },
  REGEX: {
    title: 'Regular Expressions',
    description: 'Write patterns using union, concatenation, and Kleene star operators.',
    icon: '🔍',
  },
  CFG: {
    title: 'Context-Free Grammars',
    description: 'Define production rules for context-free languages and non-regular structures.',
    icon: '🌳',
  },
  PDA: {
    title: 'Pushdown Automata',
    description: 'Build non-deterministic stack machines to accept context-free languages.',
    icon: '🥞',
  },
  NORMAL_FORMS: {
    title: 'Grammar Normal Forms (CNF / GNF)',
    description: 'Transform context-free grammars into Chomsky and Greibach Normal Forms.',
    icon: '📐',
  },
  PROOFS: {
    title: 'Pumping Lemma Proofs',
    description: 'Prove languages are non-regular or non-context-free through adversarial pumping length games.',
    icon: '🪀',
  },
  PARSING: {
    title: 'Parse Trees & Ambiguity',
    description: 'Construct syntax trees and prove grammar ambiguity using leftmost derivations.',
    icon: '🌿',
  },
};

export function getCategoryMeta(key: string): CategoryMeta {
  return (
    CATEGORY_META[key] || {
      title: `${key} Challenges`,
      description: `Practice challenges under ${key}.`,
      icon: '📌',
    }
  );
}

export function resolveCategoryKey(type: string): string {
  const upper = type.toUpperCase();
  if (upper.includes('PDA')) return 'PDA';
  if (upper.includes('CNF') || upper.includes('GNF')) return 'NORMAL_FORMS';
  if (upper.includes('PUMPING')) return 'PROOFS';
  if (upper.includes('AMBIGUITY') || upper.includes('PARSE')) return 'PARSING';
  if (upper.includes('REGEX')) return 'REGEX';
  if (upper.includes('NFA')) return 'NFA';
  if (upper.includes('DFA')) return 'DFA';
  if (upper.includes('CFG')) return 'CFG';
  return upper;
}

export type ProblemEntry = { slug: string; problem: Problem };

// Problem slugs are file names, so only allow safe characters before touching the filesystem
export function loadProblem(slug: string): Problem | null {
  if (!/^[a-z0-9-]+$/i.test(slug)) return null;
  const filePath = path.join(process.cwd(), 'public/problems', `${slug}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Problem;
}

export function loadProblemMap(slugs: string[]): Record<string, Problem> {
  const map: Record<string, Problem> = {};
  for (const slug of slugs) {
    const problem = loadProblem(slug);
    if (problem) map[slug] = problem;
  }
  return map;
}

// Reads every problem file on the server (at build time for prerendered pages)
export function loadProblems(): ProblemEntry[] {
  const problemsDir = path.join(process.cwd(), 'public/problems');
  if (!fs.existsSync(problemsDir)) return [];

  return fs
    .readdirSync(problemsDir)
    .filter((f) => f.endsWith('.json'))
    .map((file) => ({
      slug: file.replace(/\.json$/, ''),
      problem: JSON.parse(fs.readFileSync(path.join(problemsDir, file), 'utf-8')) as Problem,
    }));
}

export function groupByCategory(problems: ProblemEntry[]): { key: string; items: ProblemEntry[] }[] {
  const groups: Record<string, ProblemEntry[]> = {};
  for (const item of problems) {
    const key = resolveCategoryKey(item.problem.type || 'OTHER');
    (groups[key] ??= []).push(item);
  }
  const rank = (k: string) => (CATEGORY_ORDER.includes(k) ? CATEGORY_ORDER.indexOf(k) : CATEGORY_ORDER.length);
  return Object.keys(groups)
    .sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))
    .map((key) => ({ key, items: groups[key] }));
}
