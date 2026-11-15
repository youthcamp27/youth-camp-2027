
export default function About() {
  return (
    <main className="min-h-screen bg-[#faf9f6] text-[#20251f]">

      <nav className="max-w-7xl mx-auto px-8 pt-8">
        <a
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black transition"
        >
          ← Back to Home
        </a>
      </nav>

      <section className="max-w-7xl mx-auto px-8 py-28">

        <p className="uppercase tracking-[0.3em] text-sm text-gray-500 mb-6">
          About the Camp
        </p>

        <h1 className="text-5xl md:text-7xl font-bold mb-10">
          More Than Just
          <br />
          A Gathering.
        </h1>

        <div className="max-w-3xl">
          <p className="text-xl leading-relaxed text-gray-600 mb-8">
            Youth Camp 2027 is an opportunity for young
            people to grow in their faith, strengthen their
            relationship with God, and build meaningful
            friendships through Christian fellowship.
          </p>

          <p className="text-lg leading-relaxed text-gray-600">
            Through worship, Bible teaching, activities,
            and fellowship, we seek to encourage every
            young person to live a life centered on God's Word.
          </p>
        </div>

        <div className="mt-20 border-t border-gray-300 pt-10">
          <p className="text-sm uppercase tracking-widest text-gray-500 mb-4">
            Camp Theme
          </p>

          <h2 className="text-3xl font-semibold">
            To Be Announced
          </h2>

          <p className="mt-8 text-sm uppercase tracking-widest text-gray-500 mb-4">
            Theme Verse
          </p>

          <h2 className="text-2xl font-semibold">
            To Be Announced
          </h2>
        </div>

      </section>

    </main>
  );
}
