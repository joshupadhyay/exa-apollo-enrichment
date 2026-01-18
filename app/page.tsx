import { ExaSearchForm } from "@/components/exa-search-form";
import { Search, Database } from "lucide-react";

const LOOM_URL = "https://www.loom.com/share/c5dc93979ef04fe6b0e1884cbeb19a34";

export default function Home() {
  return (
    <main className="p-8">
      <div className="flex items-center justify-center gap-3">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Exa / Apollo Search</h1>

          <a
            href={LOOM_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
          >
            Loom on the project →
          </a>
        </div>

        {/* whatever icons you already have */}
        {/* <YourIcons /> */}
      </div>

      <ExaSearchForm />
    </main>
  );
}
