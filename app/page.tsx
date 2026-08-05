import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-white px-6 dark:bg-teal-950">
      <main className="flex flex-col items-center text-center">
        {/* Logo Mark */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 64 64"
          fill="none"
          className="mb-8 h-16 w-16"
          aria-hidden="true"
        >
          <rect width="64" height="64" rx="12" fill="#024B41" />
          <path
            d="M16 24c0-4.4 3.6-8 8-8h16c4.4 0 8 3.6 8 8v10c0 4.4-3.6 8-8 8h-4l-6 6v-6h-6c-4.4 0-8-3.6-8-8V24z"
            fill="#B8DE72"
          />
          <circle cx="26" cy="29" r="2.4" fill="#024B41" />
          <circle cx="32" cy="29" r="2.4" fill="#024B41" />
          <circle cx="38" cy="29" r="2.4" fill="#024B41" />
        </svg>

        {/* Title */}
        <h1 className="text-4xl font-semibold tracking-tight text-gray-900 dark:text-white">
          C-Support
        </h1>

        {/* Tagline */}
        <p className="mt-2 text-lg text-gray-500 dark:text-teal-100">
          AI-Powered Customer Support System
        </p>

        {/* CTA Button */}
        <Link
          href="/onboarding"
          className="mt-8 inline-flex items-center rounded-lg bg-lime-400 px-8 py-3 font-medium text-teal-950 transition-colors hover:bg-lime-500 active:scale-[0.98]"
        >
          Get Started
        </Link>
      </main>

      {/* Footer */}
      <footer className="absolute bottom-8">
        <p className="text-sm text-gray-400 dark:text-teal-600">
          C-Support
        </p>
      </footer>
    </div>
  );
}
