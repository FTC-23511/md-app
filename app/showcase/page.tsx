export const revalidate = 300; // cache 5 minutes at the edge

export default function ShowcasePage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <header className="border-b border-border pb-6">
        <h1 className="text-3xl font-semibold tracking-tight">FTC 23511 — Documentation</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          A curated view into our team&apos;s working documentation.
        </p>
      </header>

      <div className="mt-12 text-center text-sm text-muted-foreground">
        Showcase ships in Phase 4. Check back during competition season.
      </div>
    </main>
  );
}
