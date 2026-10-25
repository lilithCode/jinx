import { NextResponse } from "next/server";
import { joinJar } from "@/lib/server/jars";
import {
  HttpError, clientIp, deviceToken, handle, rateLimit, readJson, setDeviceCookie, sha256,
} from "@/lib/server/security";

export const dynamic = "force-dynamic";

export const POST = handle(async (req) => {
  const ip = clientIp(req);
  await rateLimit(`join:${ip}`, 15, 60 * 1000);
  const body = await readJson(req);
  const { token } = deviceToken(req);
  try {
    const out = await joinJar(typeof body.code === "string" ? body.code : "", sha256(token), body);
    const res = NextResponse.json(out);
    setDeviceCookie(res, token);
    return res;
  } catch (e) {
    if (e instanceof HttpError && (e.status === 404 || e.extra?.badPassword)) {
      await rateLimit(`miss:${ip}`, 10, 10 * 60 * 1000);
    }
    throw e;
  }
});
