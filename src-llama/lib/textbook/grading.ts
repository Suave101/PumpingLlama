import type { Problem } from '@/types/automata';
import { evaluateSolution } from '@/lib/logic';
import type { ActivityBlock, Block, Responses, Section } from './types';
import { checkTable, derivesTarget } from './exercises';

// Shared by the reader (instant feedback) and the score route (the grade sent to Canvas),
// so a student can't post a grade without submitting answers that earn it.

export type LabSubmission = Parameters<typeof evaluateSolution>[0];

export const isActivity = (block: Block): block is ActivityBlock =>
  block.type !== 'text' && block.type !== 'callout' && block.type !== 'tm-playground';

export const activityPoints = (block: ActivityBlock): number => block.points ?? (block.type === 'lab' ? 5 : 1);

const normalize = (s: string) => s.replace(/\s+/g, '').toLowerCase();

// Fraction of the activity's points earned by a response, from 0 to 1
export function gradeActivity(block: ActivityBlock, response: unknown, problems: Record<string, Problem>): number {
  if (response === undefined || response === null) return 0;

  switch (block.type) {
    case 'choice':
      return typeof response === 'number' && block.choices[response]?.correct ? 1 : 0;
    case 'membership': {
      if (!Array.isArray(response) || response.length !== block.strings.length) return 0;
      return block.strings.every((s, i) => response[i] === s.inL) ? 1 : 0;
    }
    case 'short':
      return typeof response === 'string' && block.answers.some((a) => normalize(a) === normalize(response)) ? 1 : 0;
    case 'table':
      return typeof response === 'object' && checkTable(block, response as Record<string, string>).status === 'correct'
        ? 1
        : 0;
    case 'derivation':
      return derivesTarget(block.grammar, response, block.target) ? 1 : 0;
    case 'trace':
    case 'nfa-trace':
    case 'tm-trace':
      return response === true ? 1 : 0;
    case 'lab': {
      const problem = problems[block.problem];
      if (!problem || typeof response !== 'object') return 0;
      try {
        return evaluateSolution(response as LabSubmission, problem).passed ? 1 : 0;
      } catch {
        return 0;
      }
    }
  }
}

export type SectionGrade = { earned: number; total: number; perActivity: Record<string, number> };

export function gradeSection(section: Section, responses: Responses, problems: Record<string, Problem>): SectionGrade {
  let earned = 0;
  let total = 0;
  const perActivity: Record<string, number> = {};
  for (const block of section.blocks) {
    if (!isActivity(block)) continue;
    const points = activityPoints(block);
    const credit = gradeActivity(block, responses[block.id], problems);
    perActivity[block.id] = credit;
    earned += credit * points;
    total += points;
  }
  return { earned, total, perActivity };
}
