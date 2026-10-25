import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { JoinFlow } from "./JoinFlow";

export const metadata: Metadata = { title: "Join a jar", robots: { index: false } };

export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return (
    <div className="flow">
      <SiteHeader />
      <main className="wrap">
        <JoinFlow code={code} />
      </main>
    </div>
  );
}
