import Link from "next/link";

export default function ContactPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-10 sm:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(56,189,248,0.16),transparent_28%),radial-gradient(circle_at_90%_20%,rgba(14,165,233,0.14),transparent_35%),linear-gradient(to_bottom,rgba(15,23,42,0.45),rgba(2,6,23,0.95))]" />

      <section className="relative mx-auto max-w-3xl rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">Contact</p>
        <h1 className="mt-3 text-3xl font-extrabold text-slate-100 sm:text-4xl">Get In Touch With Lanka-Spec</h1>
        <p className="mt-3 text-sm text-slate-300 sm:text-base">
          For collaborations, featured builds, community events, or media opportunities, send us an email and include your name, topic, and links to your project.
        </p>

        <div className="mt-6 rounded-xl border border-sky-300/30 bg-sky-300/10 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-sky-200">Primary Email</p>
          <a
            href="mailto:hello@lanka-spec.com"
            className="mt-1 inline-block text-lg font-semibold text-sky-100 transition-colors hover:text-white"
          >
            hello@lanka-spec.com
          </a>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-emerald-300"
          >
            Back to Home
          </Link>
          <Link
            href="/#cars"
            className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:border-emerald-300/60 hover:text-emerald-300"
          >
            Browse Cars
          </Link>
        </div>
      </section>
    </main>
  );
}
