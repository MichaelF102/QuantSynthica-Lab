import { NextRequest, NextResponse } from "next/server";
import { getAssetData } from "@/lib/market/serverMarketData";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol") || "SPY";
  const timeframe = searchParams.get("timeframe") || "6M";

  try {
    const data = await getAssetData(symbol, timeframe);
    if (!data) {
      return NextResponse.json({ error: `Symbol ${symbol} not found` }, { status: 404 });
    }
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch asset data" }, { status: 500 });
  }
}
