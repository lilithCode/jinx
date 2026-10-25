import type { Metadata } from "next";
import { normalizeCode } from "@/lib/constants";
import { Room } from "./Room";

export const metadata: Metadata = { title: "Your jar", robots: { index: false } };

export default async function JarPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <Room code={normalizeCode(code)} />;
}
