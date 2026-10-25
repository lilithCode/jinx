import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { CreateWizard } from "./CreateWizard";

export const metadata: Metadata = { title: "Fill a new jar" };

export default function NewJarPage() {
  return (
    <div className="flow">
      <SiteHeader showCreate={false} />
      <main className="wrap">
        <CreateWizard />
      </main>
    </div>
  );
}
