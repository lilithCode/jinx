import Link from "next/link";
import { Jar } from "@/components/Jar";
import { SiteHeader } from "@/components/SiteHeader";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="wrap flow">
        <section className="flow-card" style={{ textAlign: "center", justifyItems: "center" }}>
          <div style={{ width: 150 }}><Jar mood="sleepy" /></div>
          <h1>Nothing in this jar</h1>
          <p className="muted">This page doesn&rsquo;t exist. If someone sent you a jar code, type it on the home page.</p>
          <Link href="/" className="btn btn--primary">Back home</Link>
        </section>
      </main>
    </>
  );
}
