
import Link from "next/link";

export default function Announcements() {
  return (
    <main className="min-h-screen bg-[#faf9f6] text-[#20251f]">

      {/* Minimal Back Button */}
      <nav className="max-w-6xl mx-auto px-6 pt-8">
        <Link
          href="/"
          aria-label="Back to Home"
          className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-gray-300 text-gray-600 hover:bg-[#304b38] hover:text-white hover:border-[#304b38] transition"
        >
          ←
        </Link>
      </nav>

      {/* Announcement Posters */}
      <section className="max-w-5xl mx-auto px-6 py-12">

        <div className="space-y-8">

          <img
            src="/images/announcements/announcement-1.jpg"
            alt="Youth Camp announcement 1"
            className="w-full h-auto rounded-xl"
          />

          <img
            src="/images/announcements/announcement-2.jpg"
            alt="Youth Camp announcement 2"
            className="w-full h-auto rounded-xl"
          />

          <img
            src="/images/announcements/announcement-3.jpg"
            alt="Youth Camp announcement 3"
            className="w-full h-auto rounded-xl"
          />

        </div>

      </section>

      <footer className="text-center py-8 text-sm text-gray-500">
        © 2027 Youth Camp. All Rights Reserved.
      </footer>

    </main>
  );
}
