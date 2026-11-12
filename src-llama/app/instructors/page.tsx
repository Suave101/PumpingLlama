import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteNav } from '@/components/site/SiteNav';
import { ToolUrl } from './ToolUrl';

export const metadata: Metadata = { title: 'For instructors · Pumping Llama' };

const Step: React.FC<{ n: number; title: string; children: React.ReactNode }> = ({ n, title, children }) => (
  <li className="flex gap-4">
    <span className="shrink-0 w-8 h-8 rounded-full bg-crimson-950 border border-crimson-600/70 text-gold-300 font-mono font-bold flex items-center justify-center text-sm">
      {n}
    </span>
    <div className="flex flex-col gap-2 text-sm text-steel-300 leading-relaxed min-w-0">
      <h3 className="text-base font-semibold text-white">{title}</h3>
      {children}
    </div>
  </li>
);

export default function InstructorsPage() {
  return (
    <main className="min-h-screen bg-steel-950 text-steel-100 px-4 sm:px-8 font-sans">
      <SiteNav current="instructors" />
      <div className="max-w-3xl mx-auto pt-6 pb-20 flex flex-col gap-10">
        <header className="flex flex-col gap-3">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Use the textbook in Canvas</h1>
          <p className="text-steel-400 leading-relaxed">
            Pumping Llama is an LTI 1.3 tool. Each textbook section can be a Canvas assignment. Students open it inside
            Canvas, and their score for the section&apos;s activities and labs is graded on the server and sent to the
            gradebook as they work.
          </p>
        </header>

        <section className="flex flex-col gap-6">
          <h2 className="text-xl font-bold text-white">One-time setup (Canvas admin)</h2>
          <ol className="flex flex-col gap-6">
            <Step n={1} title="Create an LTI developer key">
              <p>
                In Canvas, go to <strong className="text-white">Admin → Developer Keys → + Developer Key → + LTI Key</strong>.
                Set <strong className="text-white">Method</strong> to &ldquo;Enter URL&rdquo; and paste the JSON URL:
              </p>
              <ToolUrl path="/api/lti/config" />
              <p>Under Redirect URIs, enter:</p>
              <ToolUrl path="/api/lti/launch" />
            </Step>
            <Step n={2} title="Turn the key on and copy its Client ID">
              <p>
                Save the key and switch it to <strong className="text-white">On</strong>. The Client ID is the long number
                in the Details column. Give it to whoever runs this server, who sets it as{' '}
                <code className="font-mono text-crimson-200">LTI_CLIENT_ID</code>.
              </p>
            </Step>
            <Step n={3} title="Install the app in your account or course">
              <p>
                Go to <strong className="text-white">Settings → Apps → View App Configurations → + App</strong>, choose
                &ldquo;By Client ID&rdquo;, and paste the Client ID.
              </p>
            </Step>
          </ol>
        </section>

        <section className="flex flex-col gap-6">
          <h2 className="text-xl font-bold text-white">Adding sections to a course</h2>
          <ol className="flex flex-col gap-6">
            <Step n={1} title="Graded: create an assignment">
              <p>
                Set the submission type to <strong className="text-white">External Tool</strong>, click{' '}
                <strong className="text-white">Find</strong>, choose Pumping Llama, and tick the sections you want. The
                points come from the section&apos;s activities: 1 per question or animation and 5 per lab.
              </p>
            </Step>
            <Step n={2} title="Ungraded: add a module item">
              <p>
                In <strong className="text-white">Modules → + → External Tool</strong>, pick Pumping Llama and choose
                sections the same way. A <strong className="text-white">Textbook</strong> link also appears in course
                navigation for the full book.
              </p>
            </Step>
          </ol>
        </section>

        <section className="bg-gradient-to-br from-steel-900 via-steel-900 to-crimson-950 border border-crimson-900/60 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white">Write your own labs</h2>
            <p className="text-sm text-steel-400 mt-1">
              The Professor Studio builds new problem files with an answer and test cases.
            </p>
          </div>
          <Link
            href="/admin/studio"
            className="shrink-0 px-5 py-3 rounded-lg border border-gold-600/60 text-gold-300 hover:bg-gold-950/60 font-semibold transition"
          >
            Open Professor Studio
          </Link>
        </section>
      </div>
    </main>
  );
}
