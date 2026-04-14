import Link from "next/link";
import { FileText } from "lucide-react";

export default function DocumentsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 md:py-14">
      <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3 text-[#2E7D32]">
        <FileText className="h-10 w-10" />
        <h1 className="font-display text-3xl font-bold">Documents</h1>
      </div>
      <p className="text-muted-foreground">
        Policies, compliance, and partner resources will appear here. For now,
        contact us for PDFs and agreements.
      </p>
      <Link
        href="/contact"
        className="inline-block font-medium text-[#2E7D32] underline-offset-4 hover:underline"
      >
        Contact Us →
      </Link>
      </div>
    </div>
  );
}
