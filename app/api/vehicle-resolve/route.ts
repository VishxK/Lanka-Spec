import { NextResponse } from 'next/server';
import { vehicles, type Vehicle } from '@/data/vehicles';
import { mergeWishlist, readCompareDb, upsertStoredVehicle, writeCompareDb, type StoredVehicle } from '@/lib/compare-db';

type ResolvePayload = {
  query?: string;
};

type GeminiVehicleResponse = {
  name: string;
  model: string;
  year: number;
  engine: string;
  type: string;
  image?: string;
  specs: Vehicle['specs'];
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'vehicle';
}

function isValidSpecs(specs: unknown): specs is Vehicle['specs'] {
  if (!specs || typeof specs !== 'object') {
    return false;
  }

  const requiredSpecKeys: Array<keyof Vehicle['specs']> = [
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

  return requiredSpecKeys.every((key) => typeof (specs as Record<string, unknown>)[key] === 'string');
}

function normalizeQuery(query: string) {
  return query.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function findCollectionMatch(query: string) {
  const normalizedQuery = normalizeQuery(query);

  return vehicles.find((vehicle) => {
    const haystack = normalizeQuery(`${vehicle.name} ${vehicle.model} ${vehicle.engine} ${vehicle.type}`);
    return haystack.includes(normalizedQuery) || normalizedQuery.includes(normalizeQuery(vehicle.name)) || normalizedQuery.includes(normalizeQuery(vehicle.model));
  }) ?? null;
}

function cleanJsonResponse(text: string) {
  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return text.slice(firstBrace, lastBrace + 1).trim();
  }

  return text.trim();
}

function buildPrompt(query: string) {
  return [
    'You are an automotive data assistant.',
    'The user wants a vehicle profile for comparison.',
    'Return ONLY valid JSON with this exact shape:',
    '{"name":"string","model":"string","year":1999,"engine":"string","type":"string","image":"/vehicle-placeholder.svg","specs":{"hp":"string","torque":"string","transmission":"string","drivetrain":"string","displacement":"string","aspiration":"string","topSpeed":"string","zeroToHundred":"string","weight":"string","fuel":"string","productionYears":"string","bodyStyle":"string"}}',
    'Use the best available knowledge. If an exact trim is unknown, choose the most commonly recognized performance version and make the labels practical and concise.',
    'Never add commentary, markdown, or extra keys.',
    `Query: ${query}`,
  ].join('\n');
}

async function resolveWithGemini(query: string): Promise<GeminiVehicleResponse> {
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('Set GEMINI_API_KEY or GOOGLE_GEMINI_API_KEY to resolve cars outside the collection.');
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
            parts: [{ text: buildPrompt(query) }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 900,
          responseMimeType: 'application/json',
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

  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join(' ').trim();
  if (!text) {
    throw new Error('Gemini returned an empty vehicle profile.');
  }

  const parsed = JSON.parse(cleanJsonResponse(text)) as GeminiVehicleResponse;

  if (
    typeof parsed.name !== 'string' ||
    typeof parsed.model !== 'string' ||
    typeof parsed.year !== 'number' ||
    typeof parsed.engine !== 'string' ||
    typeof parsed.type !== 'string' ||
    !isValidSpecs(parsed.specs)
  ) {
    throw new Error('Gemini returned an invalid vehicle profile.');
  }

  return {
    ...parsed,
    image: typeof parsed.image === 'string' && parsed.image.length > 0 ? parsed.image : '/vehicle-placeholder.svg',
  };
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as ResolvePayload | null;
  const query = payload?.query?.trim();

  if (!query) {
    return NextResponse.json({ error: 'Enter a vehicle name to search.' }, { status: 400 });
  }

  const db = await readCompareDb();
  const collectionMatch = findCollectionMatch(query);

  if (collectionMatch) {
    const wishlist = mergeWishlist(db.wishlist, [collectionMatch.id]);

    await writeCompareDb({
      wishlist,
      customVehicles: db.customVehicles,
    });

    return NextResponse.json({
      source: 'collection',
      vehicle: collectionMatch,
      wishlist,
      customVehicles: db.customVehicles,
      message: `${collectionMatch.name} ${collectionMatch.model} was found in the archive and added to your wishlist.`,
    });
  }

  const existingCustom = db.customVehicles.find((vehicle) => normalizeQuery(vehicle.sourceQuery) === normalizeQuery(query) || normalizeQuery(`${vehicle.name} ${vehicle.model}`).includes(normalizeQuery(query)));

  if (existingCustom) {
    const wishlist = mergeWishlist(db.wishlist, [existingCustom.id]);

    await writeCompareDb({
      wishlist,
      customVehicles: db.customVehicles,
    });

    return NextResponse.json({
      source: 'gemini',
      vehicle: existingCustom,
      wishlist,
      customVehicles: db.customVehicles,
      message: `${existingCustom.name} ${existingCustom.model} was loaded from db.json and added again to your wishlist.`,
    });
  }

  const resolved = await resolveWithGemini(query);
  const vehicleId = `custom-${slugify(`${resolved.name}-${resolved.model}-${query}`)}`;
  const customVehicle: StoredVehicle = {
    id: vehicleId,
    name: resolved.name,
    model: resolved.model,
    year: resolved.year,
    engine: resolved.engine,
    type: resolved.type,
    image: resolved.image ?? '/vehicle-placeholder.svg',
    specs: resolved.specs,
    source: 'gemini',
    sourceQuery: query,
    generatedAt: new Date().toISOString(),
  };

  const customVehicles = upsertStoredVehicle(db.customVehicles, customVehicle);
  const wishlist = mergeWishlist(db.wishlist, [vehicleId]);

  await writeCompareDb({
    wishlist,
    customVehicles,
  });

  return NextResponse.json({
    source: 'gemini',
    vehicle: customVehicle,
    wishlist,
    customVehicles,
    message: `${customVehicle.name} ${customVehicle.model} was generated by Gemini and added to your wishlist.`,
  });
}