import { NextResponse } from "next/server";
import { getBenchmarksData } from "@/lib/market/serverMarketData";

export async function GET() {
  try {
    const data = await getBenchmarksData();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=45, stale-while-revalidate=90",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch benchmarks" }, { status: 500 });
  }
}
