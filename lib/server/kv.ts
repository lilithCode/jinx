import "server-only";
import { Redis } from "@upstash/redis";

/**
 * Tiny key-value interface. In production this is Upstash Redis (works on Vercel);
 * locally, with no Redis env vars, it falls back to an in-memory store.
 */
export interface KV {
  get<T>(key: string): Promise<T | null>;
  mget<T>(...keys: string[]): Promise<(T | null)[]>;
  set(key: string, value: unknown, opts?: { px?: number; pxat?: number; nx?: boolean }): Promise<boolean>;
  del(key: string): Promise<void>;
  incr(key: string): Promise<number>;
  pexpire(key: string, ms: number): Promise<void>;
  rpush(key: string, value: unknown): Promise<void>;
  ltrim(key: string, start: number, stop: number): Promise<void>;
  lrange<T>(key: string, start: number, stop: number): Promise<T[]>;
}

class UpstashKV implements KV {
  constructor(private r: Redis) {}
  get<T>(key: string) {
    return this.r.get<T>(key);
  }
  async mget<T>(...keys: string[]) {
    return keys.length ? this.r.mget<(T | null)[]>(...keys) : [];
  }
  async set(key: string, value: unknown, opts: { px?: number; pxat?: number; nx?: boolean } = {}) {
    const o: Record<string, unknown> = {};
    if (opts.px) o.px = opts.px;
    if (opts.pxat) o.pxat = opts.pxat;
    if (opts.nx) o.nx = true;
    const res = await this.r.set(key, value, o as never);
    return res === "OK";
  }
  async del(key: string) {
    await this.r.del(key);
  }
  incr(key: string) {
    return this.r.incr(key);
  }
  async pexpire(key: string, ms: number) {
    await this.r.pexpire(key, ms);
  }
  async rpush(key: string, value: unknown) {
    await this.r.rpush(key, value);
  }
  async ltrim(key: string, start: number, stop: number) {
    await this.r.ltrim(key, start, stop);
  }
  lrange<T>(key: string, start: number, stop: number) {
    return this.r.lrange<T>(key, start, stop);
  }
}

type Entry = { v: unknown; exp: number };

class MemoryKV implements KV {
  private m = new Map<string, Entry>();
  private live(key: string) {
    const e = this.m.get(key);
    if (e && e.exp && e.exp < Date.now()) {
      this.m.delete(key);
      return undefined;
    }
    return e;
  }
  private clone<T>(v: unknown): T {
    return v === undefined ? (null as T) : (structuredClone(v) as T);
  }
  async get<T>(key: string) {
    return this.clone<T>(this.live(key)?.v);
  }
  async mget<T>(...keys: string[]) {
    return keys.map((k) => this.clone<T>(this.live(k)?.v));
  }
  async set(key: string, value: unknown, opts: { px?: number; pxat?: number; nx?: boolean } = {}) {
    if (opts.nx && this.live(key)) return false;
    const exp = opts.pxat ?? (opts.px ? Date.now() + opts.px : 0);
    this.m.set(key, { v: structuredClone(value), exp });
    return true;
  }
  async del(key: string) {
    this.m.delete(key);
  }
  async incr(key: string) {
    const e = this.live(key);
    const n = (Number(e?.v) || 0) + 1;
    this.m.set(key, { v: n, exp: e?.exp ?? 0 });
    return n;
  }
  async pexpire(key: string, ms: number) {
    const e = this.live(key);
    if (e) e.exp = Date.now() + ms;
  }
  private list(key: string) {
    const e = this.live(key);
    return Array.isArray(e?.v) ? (e!.v as unknown[]) : [];
  }
  async rpush(key: string, value: unknown) {
    const e = this.live(key);
    this.m.set(key, { v: [...this.list(key), structuredClone(value)], exp: e?.exp ?? 0 });
  }
  async ltrim(key: string, start: number, stop: number) {
    const e = this.live(key);
    if (!e) return;
    const l = this.list(key);
    const s = start < 0 ? Math.max(0, l.length + start) : start;
    const t = stop < 0 ? l.length + stop : stop;
    e.v = l.slice(s, t + 1);
  }
  async lrange<T>(key: string, start: number, stop: number) {
    const l = this.list(key);
    const s = start < 0 ? Math.max(0, l.length + start) : start;
    const t = stop < 0 ? l.length + stop : stop;
    return this.clone<T[]>(l.slice(s, t + 1));
  }
}

type G = typeof globalThis & { __jinxKv?: KV };
const g = globalThis as G;

/** Finds an env var by suffix, so Vercel's custom prefixes (e.g. STORAGE_KV_REST_API_URL) work too. */
function env(...suffixes: string[]) {
  for (const s of suffixes) {
    if (process.env[s]) return process.env[s];
    const key = Object.keys(process.env).find((k) => k.endsWith(`_${s}`) && process.env[k]);
    if (key) return process.env[key];
  }
}

function create(): KV {
  const url = env("KV_REST_API_URL", "UPSTASH_REDIS_REST_URL");
  const token = env("KV_REST_API_TOKEN", "UPSTASH_REDIS_REST_TOKEN");
  if (url && token) return new UpstashKV(new Redis({ url, token }));
  if (process.env.VERCEL) {
    throw new Error(
      "No Redis configured. Add Upstash Redis to this Vercel project (Storage tab) so KV_REST_API_URL and KV_REST_API_TOKEN are set.",
    );
  }
  return new MemoryKV();
}

export function kv(): KV {
  return g.__jinxKv ?? (g.__jinxKv = create());
}
