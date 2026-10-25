import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = { title: "House rules & privacy" };

export default function RulesPage() {
  return (
    <>
      <SiteHeader />
      <main className="wrap prose">
        <p className="eyebrow">The small print, but friendly</p>
        <h1>House rules</h1>
        <p>Jinx is for laughing with your friends, not at them. Before you write a slip:</p>
        <ul>
          <li>No dares that could hurt someone, break the law, or cost money someone doesn&rsquo;t want to spend.</li>
          <li>No dares about someone&rsquo;s body, private messages, or secrets they haven&rsquo;t chosen to share.</li>
          <li>Nobody has to do anything. &ldquo;Chicken out&rdquo; costs one point, that&rsquo;s it.</li>
          <li>Anyone can call a veto. If a second player agrees (or the host vetoes), the slip is thrown out for good.</li>
          <li>Got a result wrong? The host, or the player who got the dare, can change it in the history.</li>
        </ul>

        <h2>Privacy</h2>
        <ul>
          <li>No accounts, emails or phone numbers. You pick a nickname per jar.</li>
          <li>Your seat is remembered with a random cookie on your device. We only store a scrambled version of it.</li>
          <li>Slips are sealed: the server never sends a slip&rsquo;s text to other players until the jar draws it.</li>
          <li>Jars, slips and scores are kept until the host deletes the jar. Deleting is instant and permanent.</li>
          <li>No ads, no trackers, no analytics cookies.</li>
        </ul>

        <h2>Keeping jars private</h2>
        <ul>
          <li>Codes are six characters from 31 letters and numbers, so there are about 887 million of them.</li>
          <li>Wrong guesses are rate-limited per network, so nobody can try codes one after another.</li>
          <li>Hosts can add a password, lock the jar once everyone&rsquo;s in, swap to a new code, or remove a player.</li>
        </ul>
        <p><Link href="/new" className="btn btn--primary">Fill a jar</Link></p>
      </main>
    </>
  );
}
