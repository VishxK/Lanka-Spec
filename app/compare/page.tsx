import type { Metadata } from 'next';
import CompareWorkbench from '@/components/compareWorkbench';

export const metadata: Metadata = {
  title: 'Compare Cars | Lanka-Spec',
  description: 'Search, save, and compare multiple JDM cars with a local wishlist and Gemini-powered analysis.',
};

export default function ComparePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-10 sm:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_88%_14%,rgba(14,165,233,0.14),transparent_32%),linear-gradient(to_bottom,rgba(15,23,42,0.5),rgba(2,6,23,0.95))]" />

      <div className="relative mx-auto max-w-7xl">
        <header className="mb-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-300">Vehicle comparison</p>
          <h1 className="mt-3 text-4xl font-extrabold leading-tight text-slate-100 sm:text-5xl">Build your own matchup</h1>
          <p className="mt-4 max-w-3xl text-sm text-slate-300 sm:text-base">
            Save the cars you want to compare into db.json, then let Gemini explain the real-world differences in a way that is actually useful.
          </p>
        </header>

        <CompareWorkbench />
      </div>
    </main>
  );
}