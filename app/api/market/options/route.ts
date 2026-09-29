import { NextRequest, NextResponse } from "next/server";
import { getOptionsData } from "@/lib/market/serverMarketData";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol") || "SPY";
  const expiration = searchParams.get("expiration") || undefined;

  try {
    const data = await getOptionsData(symbol, expiration);
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch options data" }, { status: 500 });
  }
}
