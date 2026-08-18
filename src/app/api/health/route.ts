import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "koreanhive-web",
    time: new Date().toISOString(),
  });
}
