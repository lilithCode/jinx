import { NextRequest, NextResponse } from "next/server";
import {
  addDare, deleteDare, editDare, editHistory, hostAction, leaveJar, react, resolveDraw, shake, stateFor,
} from "@/lib/server/jars";
import { HttpError, deviceHash, handle, rateLimit, readJson } from "@/lib/server/security";
import { REACTIONS } from "@/lib/constants";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ code: string; action: string }> };

export const GET = handle(async (req: NextRequest, { params }: Ctx) => {
  const { code, action } = await params;
  if (action !== "state") throw new HttpError(404, "Not found.");
  const state = await stateFor(code, deviceHash(req));
  return NextResponse.json(state, { headers: { "Cache-Control": "no-store" } });
});

export const POST = handle(async (req: NextRequest, { params }: Ctx) => {
  const { code, action } = await params;
  const dh = deviceHash(req);
  if (!dh) throw new HttpError(403, "You haven't joined this jar yet.", { needsJoin: true });
  const body = await readJson(req);
  // Limits are per device, so one noisy player can't spam the jar.
  const limit = (name: string, max: number, ms: number) => rateLimit(`${name}:${dh}`, max, ms);

  switch (action) {
    case "add":
      await limit("add", 30, 60_000);
      await addDare(code, dh, body);
      return NextResponse.json({ ok: true });
    case "edit":
      await limit("edit", 30, 60_000);
      await editDare(code, dh, body);
      return NextResponse.json({ ok: true });
    case "delete":
      await limit("edit", 30, 60_000);
      await deleteDare(code, dh, body);
      return NextResponse.json({ ok: true });
    case "shake":
      await limit("shake", 12, 60_000);
      return NextResponse.json(await shake(code, dh));
    case "resolve":
      await limit("resolve", 30, 60_000);
      return NextResponse.json(await resolveDraw(code, dh, body));
    case "react": {
      await limit("react", 25, 10_000);
      const emoji = REACTIONS.find((r) => r === body.emoji);
      if (!emoji) throw new HttpError(400, "Unknown reaction.");
      await react(code, dh, emoji);
      return NextResponse.json({ ok: true });
    }
    case "history":
      await limit("resolve", 30, 60_000);
      return NextResponse.json(await editHistory(code, dh, body));
    case "host":
      await limit("host", 30, 60_000);
      return NextResponse.json(await hostAction(code, dh, body));
    case "leave":
      await leaveJar(code, dh);
      return NextResponse.json({ ok: true });
  }
  throw new HttpError(404, "Not found.");
});
