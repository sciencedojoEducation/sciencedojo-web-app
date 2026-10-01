"use client";
export default function CoursesError({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-2xl font-semibold">
        Courses are temporarily unavailable
      </h1>
      <p className="mt-4">
        We couldn’t load the latest course information. Please try again.
      </p>
      <button
        onClick={reset}
        className="mt-6 min-h-11 rounded-xl bg-blue-700 px-5 text-white"
      >
        Try again
      </button>
    </main>
  );
}
