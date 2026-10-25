import { NextResponse } from "next/server";
import { peekJar } from "@/lib/server/jars";
import { HttpError, clientIp, deviceHash, handle, rateLimit, readJson } from "@/lib/server/security";

export const dynamic = "force-dynamic";

export const POST = handle(async (req) => {
  const ip = clientIp(req);
  await rateLimit(`peek:${ip}`, 20, 60 * 1000);
  const { code } = await readJson(req);
  const jar = await peekJar(typeof code === "string" ? code : "", deviceHash(req));
  if (!jar) {
    // Wrong guesses are expensive: 10 misses locks this IP out for 10 minutes.
    await rateLimit(`miss:${ip}`, 10, 10 * 60 * 1000);
    throw new HttpError(404, "No jar has that code. Check the letters and try again.");
  }
  return NextResponse.json(jar);
});
