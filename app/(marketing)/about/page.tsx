export default function AboutPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
      <div className="max-w-2xl space-y-4">
      <h1 className="text-3xl font-bold">About</h1>
      <p className="text-muted-foreground">
        This platform implements a modern MLM stack: Next.js App Router API
        routes with MongoDB for transactional integrity, React for UX, and
        strict separation between ledger records and aggregate dashboards.
      </p>
      </div>
    </div>
  );
}
