import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold text-gray-900">Page not found</h1>
      <p className="text-gray-600">The page you requested does not exist.</p>
      <Link
        href="/"
        className="rounded-lg bg-[#2E7D32] px-4 py-2 text-sm font-medium text-white hover:bg-[#256628]"
      >
        Go home
      </Link>
    </div>
  );
}
