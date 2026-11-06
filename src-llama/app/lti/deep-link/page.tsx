import type { Metadata } from 'next';
import { tableOfContents } from '@/lib/textbook/book';
import { DeepLinkPicker } from './DeepLinkPicker';

export const metadata: Metadata = { title: 'Add sections to Canvas · Pumping Llama' };

// Canvas opens this after an instructor chooses Pumping Llama in an assignment or module
export default function DeepLinkPage() {
  return (
    <main className="min-h-screen bg-steel-950 text-steel-100 p-6 font-sans">
      <DeepLinkPicker chapters={tableOfContents()} />
    </main>
  );
}
