import { NextRequest, NextResponse } from "next/server";
import { live } from "@/lib/server/jars";
import { HttpError, handle } from "@/lib/server/security";

export const dynamic = "force-dynamic";

/** Polled every ~1.5s by players: returns the jar's change counter and new reactions only. */
export const GET = handle(async (req: NextRequest, { params }: { params: Promise<{ jarId: string }> }) => {
  const { jarId } = await params;
  if (!/^[A-Za-z0-9_-]{16}$/.test(jarId)) throw new HttpError(404, "Not found.");
  const after = Math.max(0, Number(req.nextUrl.searchParams.get("rx")) || 0);
  return NextResponse.json(await live(jarId, after), { headers: { "Cache-Control": "no-store" } });
});
