import { NextResponse } from 'next/server';
import { mergeWishlist, readCompareDb, writeCompareDb } from '@/lib/compare-db';

type WishlistPayload = {
  vehicleIds?: string[];
};

export async function GET() {
  const db = await readCompareDb();

  return NextResponse.json({ wishlist: db.wishlist, customVehicles: db.customVehicles });
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as WishlistPayload | null;
  const vehicleIds = Array.isArray(payload?.vehicleIds)
    ? payload.vehicleIds.filter((id): id is string => typeof id === 'string' && id.length > 0)
    : [];
  const db = await readCompareDb();
  const wishlist = vehicleIds.length === 0 ? [] : mergeWishlist([], vehicleIds);

  await writeCompareDb({
    wishlist,
    customVehicles: db.customVehicles,
  });

  return NextResponse.json({ wishlist, customVehicles: db.customVehicles });
}