import { NextResponse } from "next/server";
import { getMacroData } from "@/lib/market/serverMarketData";

export async function GET() {
  try {
    const data = await getMacroData();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch macro data" }, { status: 500 });
  }
}
