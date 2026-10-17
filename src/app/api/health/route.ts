import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json(
    { status: "ok", application: "dalimgari" },
    {
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}
