import Link from "next/link";
import { notFound } from "next/navigation";
import { vehicles } from "@/data/vehicles";
import Image from "next/image";
import { Metadata } from "next";

const specLabels: Record<string, string> = {
  hp: "Power",
  torque: "Torque",
  transmission: "Transmission",
  drivetrain: "Drivetrain",
  displacement: "Displacement",
  aspiration: "Aspiration",
  topSpeed: "Top Speed",
  zeroToHundred: "0-100 km/h",
  weight: "Curb Weight",
  fuel: "Fuel",
  productionYears: "Production",
  bodyStyle: "Body Style",
};

type CarPageProps = {
  params: Promise<{
    id: string;
  }>;
};


export async function generateMetadata({ params }: CarPageProps): Promise<Metadata> {
  const { id } = await params;
  const vehicle = vehicles.find((item) => item.id === id);

  if (!vehicle) {
    return {
      title: "Vehicle Not Found",
    };
  }

  return {
    title: `${vehicle.name} ${vehicle.model} | Specs & Details`,
  };
}

export default async function CarPage({ params }: CarPageProps) {
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const { id } = await params;
  const vehicle = vehicles.find((item) => item.id === id);

  if (!vehicle) {
    notFound();
  }

  const specEntries = Object.entries(vehicle.specs);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 sm:px-8">
      <section className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900 to-slate-950 shadow-[0_16px_40px_rgba(0,0,0,0.35)]">
        <div className="relative h-64 sm:h-80">
          <Image
            src={vehicle.image}
            alt={`${vehicle.name} ${vehicle.model}`}
            className="h-full w-full object-cover"
            width={600}
            height={400}
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.2),rgba(2,6,23,0.8))]" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">
              {vehicle.year} • {vehicle.type}
            </p>
            <h1 className="mt-2 text-3xl font-extrabold text-slate-100 sm:text-4xl">
              {vehicle.name} {vehicle.model}
            </h1>
            <p className="mt-2 text-sky-200">Engine: {vehicle.engine}</p>
          </div>
        </div>

        <div className="p-6">
          <h2 className="text-xl font-bold text-slate-100 sm:text-2xl">Complete Specification Sheet</h2>
          <p className="mt-1 text-sm text-slate-400">Every available technical detail for this model.</p>

          <div className="mt-5 grid gap-3 text-sm text-slate-200 sm:grid-cols-2 lg:grid-cols-3">
            {specEntries.map(([key, value]) => (
              <div key={key} className="rounded-lg border border-white/10 bg-white/5 p-4">
                <p className="text-slate-400">{specLabels[key] ?? key}</p>
                <p className="mt-1 text-base font-semibold text-slate-100">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-white/10 p-6">
          <Link
            href="/"
            className="inline-flex rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-emerald-300"
          >
            Back to Cars
          </Link>
        </div>
      </section>
    </main>
  );
}
