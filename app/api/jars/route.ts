import { NextResponse } from "next/server";
import { createJar } from "@/lib/server/jars";
import { clientIp, deviceToken, handle, rateLimit, readJson, setDeviceCookie, sha256 } from "@/lib/server/security";

export const dynamic = "force-dynamic";

export const POST = handle(async (req) => {
  await rateLimit(`create:${clientIp(req)}`, 10, 60 * 60 * 1000);
  const body = await readJson(req);
  const { token } = deviceToken(req);
  const out = await createJar(body, sha256(token));
  const res = NextResponse.json(out);
  setDeviceCookie(res, token);
  return res;
});
