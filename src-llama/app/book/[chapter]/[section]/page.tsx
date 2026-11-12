import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteNav } from '@/components/site/SiteNav';
import { BookContents } from '@/components/textbook/BookContents';
import { SectionReader } from '@/components/textbook/SectionReader';
import { ReadingSurface } from '@/components/textbook/ReadingSurface';
import { allSections, findSection, keyIdeasFor, labProblems, tableOfContents } from '@/lib/textbook/book';
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

  const contents = tableOfContents();

  return (
    <ReadingSurface>
      <SiteNav current="book" wide />
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[16rem_minmax(0,1fr)] gap-10 pt-4 pb-20">
        <aside className="hidden lg:block">
          <div className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto pr-2">
            <BookContents chapters={contents} currentKey={ref.key} compact />
            <Link
              href="/book/glossary"
              className="mt-5 block rounded-md px-2 py-1.5 text-sm text-steel-400 hover:text-white hover:bg-steel-900"
            >
              Glossary
            </Link>
          </div>
        </aside>
        <div className="max-w-3xl w-full flex flex-col gap-6">
          {/* Phones and tablets have no sidebar, so the contents fold into a menu above the section */}
          <details className="lg:hidden rounded-lg border border-steel-800 bg-steel-900 group">
            <summary className="cursor-pointer select-none px-4 py-2.5 text-sm text-steel-300 flex items-center justify-between">
              <span>
                Contents <span className="text-steel-500">· Chapter {ref.chapterNumber}</span>
              </span>
              <span aria-hidden="true" className="transition group-open:rotate-180">
                ▾
              </span>
            </summary>
            <div className="px-3 pb-3 max-h-[60vh] overflow-y-auto">
              <BookContents chapters={contents} currentKey={ref.key} compact />
            </div>
          </details>
          <SectionReader
            sectionKey={ref.key}
            number={`${ref.chapterNumber}.${ref.sectionNumber}`}
            chapterTitle={`Chapter ${ref.chapterNumber}: ${ref.chapter.title}`}
            section={ref.section}
            keyIdeas={keyIdeasFor(ref)}
            problems={loadProblemMap(labProblems(ref.section))}
            prev={link(index - 1)}
            next={link(index + 1)}
          />
        </div>
      </div>
    </ReadingSurface>
  );
}
