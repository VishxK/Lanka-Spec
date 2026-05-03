import { vehicles } from '@/data/vehicles';
import { NextResponse } from 'next/server';
import { readCompareDb } from '@/lib/compare-db';

type ComparePayload = {
  vehicleIds?: string[];
};

const specLabels: Record<string, string> = {
  hp: 'Power',
  torque: 'Torque',
  transmission: 'Transmission',
  drivetrain: 'Drivetrain',
  displacement: 'Displacement',
  aspiration: 'Aspiration',
  topSpeed: 'Top Speed',
  zeroToHundred: '0-100 km/h',
  weight: 'Curb Weight',
  fuel: 'Fuel',
  productionYears: 'Production',
  bodyStyle: 'Body Style',
};

function extractNumber(value: string): number | null {
  const match = value.match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function vehicleLabel(vehicle: (typeof vehicles)[number]): string {
  const model = vehicle.model.trim();
  return model ? `${vehicle.name} ${model} (${vehicle.year})` : `${vehicle.name} (${vehicle.year})`;
}

function buildLocalComparison(selectedVehicles: (typeof vehicles)[number][]) {
  const ranking = selectedVehicles.map((vehicle) => ({
    vehicle,
    hp: extractNumber(vehicle.specs.hp) ?? 0,
    torque: extractNumber(vehicle.specs.torque) ?? 0,
    topSpeed: extractNumber(vehicle.specs.topSpeed) ?? 0,
    zeroToHundred: extractNumber(vehicle.specs.zeroToHundred) ?? 0,
    weight: extractNumber(vehicle.specs.weight) ?? Number.POSITIVE_INFINITY,
  }));

  const maxBy = (selector: (item: (typeof ranking)[number]) => number) => {
    const maxValue = Math.max(...ranking.map(selector));
    return ranking.filter((item) => selector(item) === maxValue);
  };

  const minBy = (selector: (item: (typeof ranking)[number]) => number) => {
    const minValue = Math.min(...ranking.map(selector));
    return ranking.filter((item) => selector(item) === minValue);
  };

  const strongestPower = maxBy((item) => item.hp);
  const strongestTorque = maxBy((item) => item.torque);
  const fastest = maxBy((item) => item.topSpeed);
  const quickest = minBy((item) => item.zeroToHundred);
  const lightest = minBy((item) => item.weight);

  const quickRead = [
    `Compared ${selectedVehicles.length} cars: ${selectedVehicles.map(vehicleLabel).join(', ')}.`,
    `${strongestPower.map((item) => vehicleLabel(item.vehicle)).join(' / ')} leads in power at ${strongestPower[0].vehicle.specs.hp}.`,
    `${strongestTorque.map((item) => vehicleLabel(item.vehicle)).join(' / ')} leads in torque at ${strongestTorque[0].vehicle.specs.torque}.`,
    `${quickest.map((item) => vehicleLabel(item.vehicle)).join(' / ')} is quickest to 100 km/h at ${quickest[0].vehicle.specs.zeroToHundred}.`,
    `${fastest.map((item) => vehicleLabel(item.vehicle)).join(' / ')} has the top-speed edge at ${fastest[0].vehicle.specs.topSpeed}.`,
    `${lightest.map((item) => vehicleLabel(item.vehicle)).join(' / ')} is lightest at ${lightest[0].vehicle.specs.weight}.`,
  ].join(' ');

  const perCarLines = selectedVehicles.map((vehicle) => {
    return `- ${vehicleLabel(vehicle)}: ${vehicle.specs.hp}, ${vehicle.specs.torque}, 0-100 ${vehicle.specs.zeroToHundred}, top speed ${vehicle.specs.topSpeed}, ${vehicle.specs.drivetrain}, ${vehicle.specs.weight}`;
  });

  const guidance = [
    `Straight-line priority: pick ${quickest.map((item) => vehicleLabel(item.vehicle)).join(' / ')}.`,
    `Daily comfort and practicality: compare transmission, drivetrain, and body style in the table for your use case.`,
    `Balanced choice: the best option is the car whose spec strengths match your real driving scenario (city, highway, twisty roads, or track).`,
  ];

  return [
    'Quick read:',
    quickRead,
    '',
    'Per-car summary:',
    ...perCarLines,
    '',
    'Decision guide:',
    ...guidance,
  ].join('\n');
}

function buildPrompt(selectedVehicles: (typeof vehicles)[number][]) {
  const payload = selectedVehicles.map((vehicle) => ({
    name: `${vehicle.name} ${vehicle.model}`,
    year: vehicle.year,
    type: vehicle.type,
    engine: vehicle.engine,
    specs: vehicle.specs,
  }));

  return [
    'You are an automotive comparison assistant for JDM enthusiasts.',
    'Compare the following vehicles using only the supplied data.',
    'Write a practical comparison in clear Markdown with these sections:',
    '1. Overall verdict',
    '2. Best for straight-line speed',
    '3. Best for handling/balance',
    '4. Best daily driver choice',
    '5. Key tradeoffs',
    'Keep it concise, specific, and fair. Do not invent specs that are not provided.',
    `Vehicles: ${JSON.stringify(payload, null, 2)}`,
  ].join('\n');
}

async function callGemini(selectedVehicles: (typeof vehicles)[number][]) {
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const model = process.env.GEMINI_MODEL ?? 'gemini-1.5-flash';
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: buildPrompt(selectedVehicles) }],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 900,
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Gemini request failed with status ${response.status}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };

  const summary = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join(' ').trim();

  return summary || null;
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as ComparePayload | null;
  const storedDb = await readCompareDb();
  const requestedIds = Array.isArray(payload?.vehicleIds) && payload.vehicleIds.length > 0
    ? payload.vehicleIds
    : storedDb.wishlist;

  const uniqueIds = Array.from(new Set(requestedIds.filter((id): id is string => typeof id === 'string' && id.length > 0)));
  const vehicleMap = new Map<string, (typeof vehicles)[number]>([
    ...vehicles.map((vehicle) => [vehicle.id, vehicle] as const),
    ...storedDb.customVehicles.map((vehicle) => [vehicle.id, vehicle] as const),
  ]);
  const selectedVehicles = uniqueIds
    .map((id) => vehicleMap.get(id) ?? null)
    .filter((vehicle): vehicle is (typeof vehicles)[number] => vehicle !== null);

  if (selectedVehicles.length < 2) {
    return NextResponse.json(
      {
        error: 'Select at least two vehicles to compare.',
      },
      { status: 400 },
    );
  }

  const localSummary = buildLocalComparison(selectedVehicles);

  try {
    const geminiSummary = await callGemini(selectedVehicles);

    return NextResponse.json({
      summary: geminiSummary ?? localSummary,
      localSummary,
      source: geminiSummary ? 'gemini' : 'local',
      vehicles: selectedVehicles,
      specLabels,
    });
  } catch (error) {
    return NextResponse.json({
      summary: localSummary,
      localSummary,
      source: 'local',
      vehicles: selectedVehicles,
      specLabels,
      warning: error instanceof Error ? error.message : 'Unable to reach Gemini.',
    });
  }
}