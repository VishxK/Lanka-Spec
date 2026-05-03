import { vehicles } from '@/data/vehicles';
import VehicleCard from '@/components/vehicleCard';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-10 sm:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(56,189,248,0.18),transparent_30%),radial-gradient(circle_at_90%_15%,rgba(59,130,246,0.12),transparent_38%),linear-gradient(to_bottom,rgba(15,23,42,0.4),rgba(2,6,23,0.95))]" />

      <div className="relative mx-auto max-w-7xl">
        <header className="mb-10 rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm sm:p-8">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-sky-300">
            Curated 1990s Garage
          </p>
          <h1 className="max-w-4xl text-4xl font-extrabold leading-tight text-slate-100 sm:text-5xl lg:text-6xl">
            Lanka-Spec 1999 Icons
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-slate-300 sm:text-base">
            A dark-theme showcase of legendary Japanese cars from the late 1990s, with a dedicated compare studio for comparing two or more vehicles.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center rounded-full border border-sky-300/35 bg-sky-300/10 px-4 py-2 text-xs font-semibold text-sky-100">
              {vehicles.length} cars in collection
            </div>
            <Link
              href="/compare"
              className="inline-flex items-center rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-slate-100 transition-colors hover:border-sky-300/60 hover:text-sky-300"
            >
              Open compare studio
            </Link>
          </div>
        </header>

        <section id="cars" className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </section>
      </div>
    </main>
  );
}