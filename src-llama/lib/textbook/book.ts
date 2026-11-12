import type { Book, Chapter, Section } from './types';
import { isActivity } from './grading';
import { termSlug } from './slug';
import { strings } from './content/01-strings';
import { regularLanguages } from './content/02-regular-languages';
import { finiteStateMachines } from './content/03-finite-state-machines';
import { nondeterministicAutomata } from './content/04-nondeterministic-automata';
import { contextFreeLanguages } from './content/05-context-free-languages';
import { turingMachines } from './content/06-turing-machines';
import { undecidability } from './content/07-undecidability';

// Chapter order follows Jeff Erickson's "Models of Computation" lecture notes (CC BY-NC-SA 4.0),
// which students can read alongside this book. The prose and activities here are our own.
export const BOOK: Book = {
  title: 'Models of Computation',
  chapters: [
    strings,
    regularLanguages,
    finiteStateMachines,
    nondeterministicAutomata,
    contextFreeLanguages,
    turingMachines,
    undecidability,
  ],
};

export const COMPANION_READING_URL = 'https://jeffe.cs.illinois.edu/teaching/algorithms/';

export type SectionRef = {
  chapter: Chapter;
  section: Section;
  chapterNumber: number;
  sectionNumber: number;
  // Globally unique, stable id used for progress and Canvas line items
  key: string;
  href: string;
};

export const sectionKey = (chapterId: string, sectionId: string) => `${chapterId}/${sectionId}`;

export function allSections(): SectionRef[] {
  return BOOK.chapters.flatMap((chapter, ci) =>
    chapter.sections.map((section, si) => ({
      chapter,
      section,
      chapterNumber: ci + 1,
      sectionNumber: si + 1,
      key: sectionKey(chapter.id, section.id),
      href: `/book/${chapter.id}/${section.id}`,
    }))
  );
}

export function findSection(chapterId: string, sectionId: string): SectionRef | undefined {
  return allSections().find((s) => s.chapter.id === chapterId && s.section.id === sectionId);
}

// A chapter's key ideas close its last reading section, so they come right before the exercises
export function keyIdeasFor(ref: SectionRef): string | undefined {
  const reading = ref.chapter.sections.filter((s) => s.id !== 'exercises');
  return reading[reading.length - 1]?.id === ref.section.id ? ref.chapter.keyIdeas : undefined;
}

export function findSectionByKey(key: string): SectionRef | undefined {
  return allSections().find((s) => s.key === key);
}

// Slugs of the problem files a section's labs need
export function labProblems(section: Section): string[] {
  return section.blocks.flatMap((b) => (b.type === 'lab' ? [b.problem] : []));
}

export function activityCount(section: Section): number {
  return section.blocks.filter(isActivity).length;
}

export type GlossaryEntry = {
  term: string;
  kind: 'definition' | 'theorem';
  md: string;
  section: string;
  href: string;
};

// Every titled definition and theorem in the book, alphabetical, linking to where it's introduced
export function glossary(): GlossaryEntry[] {
  return allSections()
    .flatMap((ref) =>
      ref.section.blocks.flatMap((block) =>
        block.type === 'callout' && block.title && (block.kind === 'definition' || block.kind === 'theorem')
          ? [
              {
                term: block.title,
                kind: block.kind,
                md: block.md,
                section: `${ref.chapterNumber}.${ref.sectionNumber} ${ref.section.title}`,
                href: `${ref.href}#${termSlug(block.title)}`,
              },
            ]
          : []
      )
    )
    .sort((a, b) => a.term.localeCompare(b.term, 'en', { sensitivity: 'base' }));
}

// Plain data for the table of contents (safe to pass to client components)
export type ContentsChapter = {
  id: string;
  number: number;
  title: string;
  summary: string;
  sections: { key: string; number: string; title: string; href: string; activities: number }[];
};

export function tableOfContents(): ContentsChapter[] {
  return BOOK.chapters.map((chapter, ci) => ({
    id: chapter.id,
    number: ci + 1,
    title: chapter.title,
    summary: chapter.summary,
    sections: chapter.sections.map((section, si) => ({
      key: sectionKey(chapter.id, section.id),
      number: `${ci + 1}.${si + 1}`,
      title: section.title,
      href: `/book/${chapter.id}/${section.id}`,
      activities: activityCount(section),
    })),
  }));
}
