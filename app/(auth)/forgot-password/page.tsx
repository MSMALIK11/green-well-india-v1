import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8F9FA] px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-lg">
        <h1 className="font-display text-2xl font-bold text-[#1B5E20]">
          Forgot password
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Reset flow is not wired yet. Contact support or use seed credentials
          for local testing.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm font-medium text-[#2E7D32] hover:underline"
        >
          ← Back to login
        </Link>
      </div>
    </div>
  );
}
