'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { Vehicle } from '@/data/vehicles';
import { vehicles } from '@/data/vehicles';
import type { StoredVehicle } from '@/lib/compare-db';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

type CompareApiResponse = {
  summary: string;
  localSummary: string;
  source: 'gemini' | 'local';
  warning?: string;
  vehicles: Vehicle[];
  specLabels: Record<string, string>;
};

type WishlistResponse = {
  wishlist: string[];
  customVehicles: StoredVehicle[];
};

type ResolveVehicleResponse = {
  source: 'collection' | 'gemini';
  vehicle: Vehicle;
  wishlist: string[];
  customVehicles: StoredVehicle[];
  message: string;
  error?: string;
};

async function readJsonResponse<T>(response: Response): Promise<T | null> {
  const text = await response.text();

  if (!text.trim()) {
    return null;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

const resultSpecOrder: Array<keyof Vehicle['specs']> = [
  'hp',
  'torque',
  'transmission',
  'drivetrain',
  'displacement',
  'aspiration',
  'topSpeed',
  'zeroToHundred',
  'weight',
  'fuel',
  'productionYears',
  'bodyStyle',
];

function vehicleColumnLabel(vehicle: Vehicle): string {
  const model = vehicle.model.trim();
  const year = Number.isFinite(vehicle.year) ? ` (${vehicle.year})` : '';

  if (!model) {
    return `${vehicle.name}${year}`;
  }

  return `${vehicle.name} ${model}${year}`;
}

export default function CompareWorkbench() {
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [customVehicles, setCustomVehicles] = useState<StoredVehicle[]>([]);
  const [summary, setSummary] = useState('');
  const [localSummary, setLocalSummary] = useState('');
  const [source, setSource] = useState<'gemini' | 'local' | null>(null);
  const [warning, setWarning] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isComparing, setIsComparing] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [specLabels, setSpecLabels] = useState<Record<string, string>>({});
  const verdictRef = useRef<HTMLElement | null>(null);

  const vehicleMap = useMemo(
    () => new Map<string, Vehicle>([...vehicles, ...customVehicles].map((vehicle) => [vehicle.id, vehicle])),
    [customVehicles],
  );

  useEffect(() => {
    let active = true;

    async function loadWishlist() {
      try {
        const response = await fetch('/api/wishlist');
        const data = (await response.json()) as WishlistResponse;

        if (active) {
          setSelectedIds(Array.isArray(data.wishlist) ? data.wishlist : []);
          setCustomVehicles(Array.isArray(data.customVehicles) ? data.customVehicles : []);
        }
      } catch {
        if (active) {
          setWarning('Could not load the saved wishlist, but you can still build a new comparison.');
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadWishlist();

    return () => {
      active = false;
    };
  }, []);

  const selectedVehicles = selectedIds.map((id) => vehicleMap.get(id)).filter((vehicle): vehicle is Vehicle => Boolean(vehicle));

  const filteredVehicles = vehicles.filter((vehicle) => {
    const haystack = `${vehicle.name} ${vehicle.model} ${vehicle.engine} ${vehicle.type}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  const searchValue = search.trim();

  async function saveWishlist(nextIds: string[]) {
    setIsSaving(true);
    setWarning('');

    try {
      const response = await fetch('/api/wishlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vehicleIds: nextIds }),
      });

      if (!response.ok) {
        throw new Error('Wishlist save failed');
      }

      const data = (await response.json()) as WishlistResponse;
      setCustomVehicles(Array.isArray(data.customVehicles) ? data.customVehicles : []);
    } catch {
      setWarning('The wishlist could not be saved to db.json right now.');
    } finally {
      setIsSaving(false);
    }
  }

  async function resolveVehicleFromSearch() {
    if (!searchValue) {
      setWarning('Type a vehicle name, chassis code, or model to search.');
      return;
    }

    setIsResolving(true);
    setWarning('');

    try {
      const response = await fetch('/api/vehicle-resolve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchValue }),
      });

      const data = await readJsonResponse<ResolveVehicleResponse>(response);

      if (!response.ok) {
        throw new Error(data?.error ?? 'Could not resolve the vehicle.');
      }

      if (!data) {
        throw new Error('Could not resolve the vehicle.');
      }

      setSelectedIds(Array.isArray(data.wishlist) ? data.wishlist : []);
      setCustomVehicles(Array.isArray(data.customVehicles) ? data.customVehicles : []);
      setSearch(data.vehicle.name);
      setWarning(data.message);
    } catch (error) {
      setWarning(error instanceof Error ? error.message : 'Vehicle lookup failed.');
    } finally {
      setIsResolving(false);
    }
  }

  function toggleVehicle(vehicleId: string) {
    setSummary('');
    setLocalSummary('');
    setSource(null);

    setSelectedIds((current) => {
      let next: string[];

      if (current.includes(vehicleId)) {
        next = current.filter((id) => id !== vehicleId);
      } else {
        next = [...current, vehicleId].slice(0, 6);
      }

      void saveWishlist(next);
      return next;
    });
  }

  async function runComparison() {
    if (selectedVehicles.length < 2) {
      setWarning('Pick at least two vehicles before generating the comparison.');
      return;
    }

    setIsComparing(true);
    setWarning('');

    try {
      const response = await fetch('/api/compare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vehicleIds: selectedIds }),
      });

      const data = await readJsonResponse<CompareApiResponse & { error?: string }>(response);

      if (!response.ok) {
        throw new Error(data?.error ?? 'Could not build comparison');
      }

      if (!data) {
        throw new Error('Could not build comparison');
      }

      setSummary(data.summary);
      setLocalSummary(data.localSummary);
      setSource(data.source);
      setSpecLabels(data.specLabels ?? {});
      if (data.warning) {
        setWarning(data.warning);
      }
    } catch (error) {
      setWarning(error instanceof Error ? error.message : 'Comparison failed.');
    } finally {
      setIsComparing(false);
    }
  }

  const markdownComponents: Components = {
    p: ({ children }) => <p className="mb-3 text-sm text-slate-300 last:mb-0">{children}</p>,
    h1: ({ children }) => <h1 className="mb-3 text-2xl font-bold text-slate-100">{children}</h1>,
    h2: ({ children }) => <h2 className="mb-2 text-xl font-semibold text-slate-100">{children}</h2>,
    h3: ({ children }) => <h3 className="mb-2 text-lg font-semibold text-slate-100">{children}</h3>,
    ul: ({ children }) => <ul className="mb-3 list-disc space-y-1 pl-5 text-sm text-slate-300">{children}</ul>,
    ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1 pl-5 text-sm text-slate-300">{children}</ol>,
    li: ({ children }) => <li>{children}</li>,
    strong: ({ children }) => <strong className="font-semibold text-slate-100">{children}</strong>,
  };

  useEffect(() => {
    if (!summary) return;

    // allow the DOM to render the generated content, then scroll into view
    const id = setTimeout(() => {
      verdictRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);

    return () => clearTimeout(id);
  }, [summary]);

  return (
    <div className="space-y-8">
      <section className="grid gap-6 rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm lg:grid-cols-[1.2fr_0.8fr] lg:p-6">
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-300">Compare studio</p>
            <h2 className="mt-2 text-2xl font-extrabold text-slate-100 sm:text-3xl">Search, save, and compare the cars you care about</h2>
            <p className="mt-3 max-w-2xl text-sm text-slate-300">
              Search the archive, add the vehicles to your wishlist, and let Gemini turn the spec sheet into a practical side-by-side verdict.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Search any vehicle
              </span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    void resolveVehicleFromSearch();
                  }
                }}
                placeholder="Try Supra, Evo, RX-7, Cayman, M3, R8..."
                className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-sky-300/60 focus:ring-2 focus:ring-sky-300/20"
              />
            </label>

            <button
              type="button"
              onClick={() => void resolveVehicleFromSearch()}
              disabled={isResolving}
              className="self-end rounded-2xl bg-sky-300 px-4 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-sky-200 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            >
              {isResolving ? 'Resolving...' : 'Add vehicle'}
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {filteredVehicles.map((vehicle) => {
              const isSelected = selectedIds.includes(vehicle.id);

              return (
                <article
                  key={vehicle.id}
                  className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 shadow-[0_10px_24px_rgba(0,0,0,0.25)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-sky-300">{vehicle.year}</p>
                      <h3 className="mt-1 text-lg font-bold text-slate-100">{vehicle.name}</h3>
                      <p className="text-sm text-sky-200">{vehicle.model} • {vehicle.engine}</p>
                    </div>
                    <span className="rounded-full border border-white/10 px-2 py-1 text-[11px] text-slate-300">{vehicle.type}</span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-300">
                    <div className="rounded-lg border border-white/10 bg-white/5 p-2">Power: {vehicle.specs.hp}</div>
                    <div className="rounded-lg border border-white/10 bg-white/5 p-2">0-100: {vehicle.specs.zeroToHundred}</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleVehicle(vehicle.id)}
                    className={`mt-4 w-full rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                      isSelected
                        ? 'border border-emerald-300/40 bg-emerald-300/15 text-emerald-200 hover:bg-emerald-300/20'
                        : 'bg-emerald-400 text-slate-950 hover:bg-emerald-300'
                    }`}
                  >
                    {isSelected ? 'Remove from comparison' : 'Add to comparison'}
                  </button>
                </article>
              );
            })}
          </div>

          {filteredVehicles.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-slate-400">
              No collection cars match that search. Use Add vehicle to let Gemini build the profile for an outside car.
            </p>
          ) : null}
        </div>

        <aside className="space-y-4 rounded-2xl border border-white/10 bg-slate-950/70 p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">Comparison selection</p>
            <h3 className="mt-2 text-xl font-bold text-slate-100">{selectedVehicles.length} selected</h3>
            <p className="mt-2 text-sm text-slate-400">
              Your selection is written to db.json so you can keep building the comparison locally.
            </p>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              <p className="text-sm text-slate-400">Loading saved vehicles...</p>
            ) : selectedVehicles.length > 0 ? (
              selectedVehicles.map((vehicle) => (
                <div key={vehicle.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-100">{vehicle.name}</p>
                      <p className="text-xs text-slate-400">{vehicle.model} • {vehicle.engine}</p>
                      {'source' in vehicle && vehicle.source === 'gemini' ? (
                        <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-amber-200">Gemini profile</p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleVehicle(vehicle.id)}
                      className="rounded-full border border-white/10 px-2 py-1 text-xs text-slate-300 transition hover:border-sky-300/50 hover:text-sky-300"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">Add two or more vehicles to unlock the AI comparison.</p>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => void runComparison()}
              disabled={isComparing || selectedVehicles.length < 2}
              className="rounded-xl bg-sky-300 px-4 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-sky-200 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            >
              {isComparing ? 'Generating comparison...' : isSaving ? 'Saving wishlist...' : 'Generate AI comparison'}
            </button>

            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-400">
              <p className="font-semibold uppercase tracking-[0.16em] text-slate-300">How it works</p>
              <p className="mt-2">
                Search the built-in garage or type any other vehicle. If it is not in the archive, Gemini builds a fresh profile and saves it to db.json automatically.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 text-xs text-slate-400">
              <Link href="/" className="transition-colors hover:text-sky-300">Back to catalog</Link>
              <span>•</span>
              <Link href="/contact" className="transition-colors hover:text-sky-300">Contact</Link>
            </div>
          </div>
        </aside>
      </section>

      {warning ? (
        <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-100">
          {warning}
        </div>
      ) : null}

      {summary ? (
        <section ref={verdictRef} className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">AI verdict</p>
            <h3 className="mt-2 text-2xl font-bold text-slate-100">{source === 'gemini' ? 'Gemini comparison' : 'Local fallback comparison'}</h3>
            <div className="mt-3 prose prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {summary}
              </ReactMarkdown>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70">
            <div className="border-b border-white/10 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">Selected specs</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-white/5 text-slate-300">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Spec</th>
                    {selectedVehicles.map((vehicle) => (
                      <th key={vehicle.id} className="px-5 py-3 font-semibold">{vehicleColumnLabel(vehicle)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {resultSpecOrder.map((specKey) => (
                    <tr key={specKey} className="border-t border-white/10">
                      <td className="px-5 py-3 font-medium text-slate-200">{specLabels[specKey] ?? specKey}</td>
                      {selectedVehicles.map((vehicle) => (
                        <td key={`${vehicle.id}-${specKey}`} className="px-5 py-3 text-slate-400">
                          {vehicle.specs[specKey]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ) : null}

      {localSummary && summary !== localSummary ? (
        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">Local backup</p>
          <div className="mt-3 prose prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {localSummary}
            </ReactMarkdown>
          </div>
        </section>
      ) : null}
    </div>
  );
}