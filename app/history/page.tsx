"use client";

import React, { useEffect, useMemo, useState } from 'react';
import type { Vehicle } from '@/data/vehicles';
import { vehicles as collection } from '@/data/vehicles';
import type { StoredVehicle } from '@/lib/compare-db';
import Link from 'next/link';

type WishlistResponse = {
  wishlist: string[];
  customVehicles: StoredVehicle[];
};

export default function HistoryPage() {
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [customVehicles, setCustomVehicles] = useState<StoredVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch('/api/wishlist');
        if (!res.ok) throw new Error('Failed to load history');
        const data = (await res.json()) as WishlistResponse;
        if (!active) return;
        setWishlist(Array.isArray(data.wishlist) ? data.wishlist : []);
        setCustomVehicles(Array.isArray(data.customVehicles) ? data.customVehicles : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  const idToVehicle = useMemo(() => {
    const map = new Map<string, Vehicle | StoredVehicle>();
    for (const v of collection) map.set(v.id, v);
    for (const v of customVehicles) map.set(v.id, v);
    return map;
  }, [customVehicles]);

  const wishlistVehicles = wishlist.map((id) => idToVehicle.get(id)).filter(Boolean) as (Vehicle | StoredVehicle)[];

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-10 sm:px-8">
      <div className="relative mx-auto max-w-7xl">
        <header className="mb-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-300">History</p>
          <h1 className="mt-3 text-4xl font-extrabold text-slate-100">Previously compared vehicles</h1>
          <p className="mt-3 text-sm text-slate-300">View your saved wishlist and previously AI-generated vehicle profiles with full specs.</p>
          <div className="mt-4 flex gap-3">
            <Link href="/compare" className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-slate-100 transition-colors hover:border-sky-300/60 hover:text-sky-300">Open Compare</Link>
            <Link href="/" className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-slate-100 transition-colors hover:border-sky-300/60 hover:text-sky-300">Back to Catalog</Link>
          </div>
        </header>

        <section className="space-y-8">
          <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
            <h2 className="text-lg font-semibold text-slate-100">Saved wishlist</h2>
            {loading ? (
              <p className="mt-3 text-sm text-slate-400">Loading…</p>
            ) : error ? (
              <p className="mt-3 text-sm text-amber-200">{error}</p>
            ) : wishlistVehicles.length === 0 ? (
              <p className="mt-3 text-sm text-slate-400">No saved vehicles yet. Add some from the compare studio.</p>
            ) : (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {wishlistVehicles.map((v) => (
                  <article key={(v as any).id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-100">{(v as any).name} {(v as any).model && ` ${(v as any).model}`} {(v as any).year && ` (${(v as any).year})`}</h3>
                        <p className="mt-1 text-sm text-slate-400">{(v as any).engine} • {(v as any).type}</p>
                        <div className="mt-3 text-xs text-slate-300 grid grid-cols-2 gap-2">
                          {Object.entries((v as any).specs).map(([key, val]) => (
                            <div key={key} className="rounded-lg border border-white/10 bg-white/5 p-2">{key}: {String(val)}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
            <h2 className="text-lg font-semibold text-slate-100">AI-generated profiles (db.json)</h2>
            {customVehicles.length === 0 ? (
              <p className="mt-3 text-sm text-slate-400">No AI-generated vehicles stored yet.</p>
            ) : (
              <div className="mt-4 space-y-4">
                {customVehicles.map((v) => (
                  <article key={v.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-100">{v.name} {v.model} ({v.year})</h3>
                        <p className="mt-1 text-sm text-slate-400">{v.engine} • {v.type} • Generated: {new Date(v.generatedAt).toLocaleString()}</p>

                        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 text-sm text-slate-300">
                          {Object.entries(v.specs).map(([k, val]) => (
                            <div key={k} className="rounded-lg border border-white/10 bg-white/5 p-2">
                              <div className="font-medium text-slate-200">{k}</div>
                              <div className="mt-1 text-slate-300">{val}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
