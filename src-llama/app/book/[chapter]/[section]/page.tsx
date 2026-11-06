import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SiteNav } from '@/components/site/SiteNav';
import { BookContents } from '@/components/textbook/BookContents';
import { SectionReader } from '@/components/textbook/SectionReader';
import { allSections, findSection, labProblems, tableOfContents } from '@/lib/textbook/book';
import { loadProblemMap } from '@/lib/problems';

type Params = { params: Promise<{ chapter: string; section: string }> };

export function generateStaticParams() {
  return allSections().map((s) => ({ chapter: s.chapter.id, section: s.section.id }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { chapter, section } = await params;
  const ref = findSection(chapter, section);
  return { title: ref ? `${ref.chapterNumber}.${ref.sectionNumber} ${ref.section.title} · Pumping Llama` : 'Pumping Llama' };
}

export default async function SectionPage({ params }: Params) {
  const { chapter, section } = await params;
  const ref = findSection(chapter, section);
  if (!ref) notFound();

  const sections = allSections();
  const index = sections.findIndex((s) => s.key === ref.key);
  const link = (i: number) => {
    const s = sections[i];
    return s ? { href: s.href, title: `${s.chapterNumber}.${s.sectionNumber} ${s.section.title}` } : null;
  };

  return (
    <main className="min-h-screen bg-steel-950 text-steel-100 px-4 sm:px-8 font-sans">
      <SiteNav current="book" wide />
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[16rem_minmax(0,1fr)] gap-10 pt-4 pb-20">
        <aside className="hidden lg:block">
          <div className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto pr-2">
            <BookContents chapters={tableOfContents()} currentKey={ref.key} compact />
          </div>
        </aside>
        <div className="max-w-3xl w-full">
          <SectionReader
            sectionKey={ref.key}
            number={`${ref.chapterNumber}.${ref.sectionNumber}`}
            chapterTitle={`Chapter ${ref.chapterNumber}: ${ref.chapter.title}`}
            section={ref.section}
            problems={loadProblemMap(labProblems(ref.section))}
            prev={link(index - 1)}
            next={link(index + 1)}
          />
        </div>
      </div>
    </main>
  );
}
