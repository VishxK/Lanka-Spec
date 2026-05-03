"use client";

import React, { useState } from 'react';
import type { Vehicle } from '@/data/vehicles';
import Image from 'next/image';
import Link from 'next/link';

export default function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);

  async function addToComparison() {
    if (isAdding) return;
    setIsAdding(true);

    try {
      const res = await fetch('/api/wishlist');
      const data = await res.json();
      const current: string[] = Array.isArray(data?.wishlist) ? data.wishlist : [];
      const next = current.includes(vehicle.id) ? current : [...current, vehicle.id].slice(0, 6);

      const save = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleIds: next }),
      });

      if (!save.ok) throw new Error('Save failed');

      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    } catch (err) {
      // minimal user feedback
      // eslint-disable-next-line no-console
      console.error('Could not add to comparison', err);
      // keep UX simple: inform user via alert
      // eslint-disable-next-line no-alert
      alert('Could not add to comparison right now.');
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900 to-slate-950 p-1 shadow-[0_8px_30px_rgba(0,0,0,0.35)] transition-all duration-300 hover:-translate-y-1 hover:border-sky-400/35 hover:shadow-[0_16px_40px_rgba(56,189,248,0.22)]">
      <div className="relative h-44 overflow-hidden rounded-xl border border-white/5">
        <Image
          src={vehicle.image}
          alt={`${vehicle.name} ${vehicle.model}`}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          width={400}
          height={300}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.15),rgba(2,6,23,0.72))]" />
        <div className="absolute inset-0 bg-[linear-gradient(130deg,rgba(56,189,248,0.12),transparent_45%,rgba(148,163,184,0.12))]" />
        <div className="relative z-10 flex h-full flex-col justify-between p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-200/90">
            JDM Archive {vehicle.year}
          </p>
          <span className="self-start rounded-full border border-sky-300/40 bg-sky-300/10 px-2 py-1 text-[11px] font-medium text-sky-100">
            {vehicle.type}
          </span>
        </div>
      </div>

      <div className="space-y-3 p-5">
        <div>
          <h3 className="text-2xl font-bold leading-tight text-slate-100">{vehicle.name}</h3>
          <p className="mt-1 text-sm font-medium text-sky-300">
            {vehicle.model} • {vehicle.engine}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
          <div className="rounded-lg border border-white/10 bg-white/5 p-2">Power: {vehicle.specs.hp}</div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-2">Fuel: {vehicle.specs.fuel}</div>
          <div className="col-span-2 rounded-lg border border-white/10 bg-white/5 p-2">
            Transmission: {vehicle.specs.transmission}
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <Link
            href={`/cars/${vehicle.id}`}
            prefetch={false}
            className="flex-1 rounded-lg bg-emerald-400 px-3 py-2 text-center text-sm font-semibold text-slate-950 transition-colors hover:bg-emerald-300"
          >
            View Specs
          </Link>
          <button
            type="button"
            onClick={() => void addToComparison()}
            disabled={isAdding}
            aria-label={`Add ${vehicle.name} to comparison`}
            title={`Add ${vehicle.name} to comparison`}
            className={`flex-1 rounded-2xl px-4 py-2 text-sm font-semibold transition-transform duration-200 focus:outline-none focus:ring-4 focus:ring-sky-300/30 disabled:opacity-60 disabled:cursor-not-allowed ${
              added
                ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-md hover:scale-100'
                : 'bg-gradient-to-r from-sky-400 to-emerald-400 text-white shadow hover:scale-105 hover:shadow-lg'
            }`}
          >
            {isAdding ? 'Adding…' : added ? 'Added ✓' : 'Add to compare'}
          </button>
        </div>
      </div>
    </article>
  );
}