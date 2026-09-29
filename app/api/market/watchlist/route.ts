import { NextResponse } from "next/server";
import { getWatchlistData } from "@/lib/market/serverMarketData";

export async function GET() {
  try {
    const data = await getWatchlistData();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=45, stale-while-revalidate=90",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch watchlist" }, { status: 500 });
  }
}
