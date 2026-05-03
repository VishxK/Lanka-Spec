export default function Loading() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 sm:px-8" aria-busy="true" aria-live="polite">
      <section className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900 to-slate-950 shadow-[0_16px_40px_rgba(0,0,0,0.35)]">
        <div className="relative h-64 animate-pulse bg-slate-800 sm:h-80">
          <div className="absolute bottom-0 left-0 right-0 space-y-3 p-6">
            <div className="h-3 w-36 rounded bg-slate-700" />
            <div className="h-8 w-64 rounded bg-slate-700" />
            <div className="h-4 w-44 rounded bg-slate-700" />
          </div>
        </div>

        <div className="p-6">
          <div className="h-7 w-72 animate-pulse rounded bg-slate-800" />
          <div className="mt-3 h-4 w-80 animate-pulse rounded bg-slate-800" />

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 12 }).map((_, index) => (
              <div
                key={index}
                className="rounded-lg border border-white/10 bg-white/5 p-4"
              >
                <div className="h-3 w-24 animate-pulse rounded bg-slate-700" />
                <div className="mt-2 h-5 w-28 animate-pulse rounded bg-slate-600" />
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-white/10 p-6">
          <div className="h-10 w-32 animate-pulse rounded-lg bg-emerald-400/40" />
        </div>
      </section>
    </main>
  );
}