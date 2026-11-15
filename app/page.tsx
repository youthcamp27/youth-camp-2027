
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#faf9f6] text-[#20251f]">

      {/* STICKY NAVIGATION */}
      <nav className="sticky top-0 z-50 border-b border-black/5 bg-[#faf9f6]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5">

          <a href="#home" className="shrink-0">
            <h1 className="text-lg font-bold tracking-wider">
              YOUTH CAMP 2027
            </h1>
            <p className="text-[10px] tracking-[0.25em] text-gray-500">
              GROWING IN FAITH
            </p>
          </a>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-xs font-medium md:text-sm">
            <a href="#home" className="hover:text-[#66836b]">Home</a>
            <a href="#about" className="hover:text-[#66836b]">About</a>
            <a href="#schedule" className="hover:text-[#66836b]">Schedule</a>
            <a href="#announcements" className="hover:text-[#66836b]">Announcements</a>

            <Link
              href="/registration"
              className="rounded-full bg-[#304b38] px-5 py-3 text-white transition hover:bg-[#46634d]"
            >
              Register
            </Link>
          </div>
        </div>
      </nav>

      {/* HOME SECTION */}
      <section
        id="home"
        className="scroll-mt-28 flex min-h-[75vh] items-center bg-[#26382d] px-6 py-24 text-white"
      >
        <div className="mx-auto w-full max-w-7xl">
          <div className="max-w-3xl">

            <p className="mb-6 text-sm uppercase tracking-[0.3em] text-gray-300">
              A gathering of faith, fellowship, and purpose
            </p>

            <h2 className="mb-8 text-5xl font-bold leading-tight md:text-7xl">
              A Generation
              <br />
              Rooted in
              <br />
              <span className="text-[#a9c4a9]">His Word.</span>
            </h2>

            <p className="mb-10 max-w-xl text-lg leading-relaxed text-gray-200">
              Join us for Youth Camp 2027, a special gathering
              dedicated to growing in faith, building friendships,
              and strengthening our walk with God.
            </p>

            <Link
              href="/registration"
              className="inline-block rounded-full bg-white px-8 py-4 font-semibold text-[#304b38] transition hover:bg-gray-200"
            >
              Register Your Church →
            </Link>

          </div>
        </div>
      </section>

      {/* CAMP INFORMATION */}
      <section className="bg-[#304b38] py-12 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 md:grid-cols-3">

          <div>
            <p className="mb-2 text-xs tracking-widest text-gray-300">EVENT</p>
            <h3 className="text-xl font-semibold">Youth Camp 2027</h3>
          </div>

          <div>
            <p className="mb-2 text-xs tracking-widest text-gray-300">THEME</p>
            <h3 className="text-xl font-semibold">To Be Announced</h3>
          </div>

          <div>
            <p className="mb-2 text-xs tracking-widest text-gray-300">REGISTRATION</p>
            <h3 className="text-xl font-semibold">Coming Soon</h3>
          </div>

        </div>
      </section>

      {/* ABOUT SECTION */}
      <section id="about" className="scroll-mt-28 px-6 py-24">
        <div className="mx-auto max-w-7xl">

          <p className="mb-5 text-sm uppercase tracking-[0.3em] text-[#66836b]">
            Get to Know Us
          </p>

          <h2 className="mb-8 text-4xl font-bold md:text-6xl">
            More Than Just
            <br />
            A Gathering.
          </h2>

          <p className="mb-16 max-w-3xl text-lg leading-relaxed text-gray-600">
            Youth Camp 2027 is an opportunity for young people
            to grow in their relationship with God, strengthen
            their faith, and build meaningful friendships through
            Christian fellowship. Together, we seek to encourage
            a generation to live according to God's Word.
          </p>

          {/* MINISTRY INTRODUCTION */}
          <div className="mb-16 grid items-center gap-10 md:grid-cols-2">

            <div className="flex aspect-video items-center justify-center rounded-2xl bg-[#e8e8df] p-8 text-center">
              <div>
                <p className="mb-2 text-sm font-semibold text-[#304b38]">
                  MINISTRY VIDEO
                </p>
                <p className="text-sm text-gray-500">
                  Your youth ministry video will appear here.
                </p>
              </div>
            </div>

            <div>
              <p className="mb-4 text-xs uppercase tracking-widest text-[#66836b]">
                Our Ministry
              </p>
              <h3 className="mb-5 text-3xl font-semibold">
                Growing Together in Christ.
              </h3>
              <p className="leading-relaxed text-gray-600">
                Our youth ministry seeks to help young people
                know God, grow in His Word, serve with purpose,
                and encourage one another through Christian
                fellowship. Through our gatherings and activities,
                we desire to see young lives strengthened in faith.
              </p>
            </div>

          </div>

          {/* CAMP INTRODUCTION */}
          <div className="grid items-center gap-10 md:grid-cols-2">

            <div className="order-2 md:order-1">
              <p className="mb-4 text-xs uppercase tracking-widest text-[#66836b]">
                The Camp
              </p>
              <h3 className="mb-5 text-3xl font-semibold">
                A Time to Grow, Connect, and Serve.
              </h3>
              <p className="leading-relaxed text-gray-600">
                Youth Camp is a special time set apart for
                Bible teaching, worship, fellowship, and
                activities that encourage spiritual growth.
                It is an opportunity to step away from everyday
                routines and focus on our walk with the Lord.
              </p>
            </div>

            <div className="order-1 flex aspect-video items-center justify-center rounded-2xl bg-[#e8e8df] p-8 text-center md:order-2">
              <div>
                <p className="mb-2 text-sm font-semibold text-[#304b38]">
                  YOUTH CAMP VIDEO
                </p>
                <p className="text-sm text-gray-500">
                  Your camp introduction video will appear here.
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* SCHEDULE SECTION */}
      <section id="schedule" className="scroll-mt-28 bg-[#304b38] px-6 py-24 text-white">
        <div className="mx-auto max-w-7xl">

          <p className="mb-5 text-sm uppercase tracking-[0.3em] text-gray-300">
            Plan Your Experience
          </p>

          <h2 className="mb-8 text-4xl font-bold md:text-6xl">
            Camp Schedule.
          </h2>

          <p className="mb-12 max-w-2xl leading-relaxed text-gray-300">
            Important dates, activities, and program details
            for Youth Camp 2027 will be published here once
            they are officially finalized.
          </p>

          <div className="grid gap-5 md:grid-cols-3">

            {["Registration Opens", "Registration Deadline", "Camp Dates"].map((item) => (
              <div key={item} className="rounded-xl border border-white/20 p-7">
                <p className="mb-3 text-xs tracking-widest text-gray-300">
                  {item.toUpperCase()}
                </p>
                <h3 className="text-xl font-semibold">To Be Announced</h3>
              </div>
            ))}

          </div>

          <div className="mt-16 rounded-2xl border border-white/20 p-8 text-center">
            <p className="mb-3 text-sm uppercase tracking-widest text-gray-300">
              Official Camp Program
            </p>
            <h3 className="mb-3 text-2xl font-semibold">
              Coming Soon
            </h3>
            <p className="text-sm text-gray-300">
              The official program and schedule will be posted here.
            </p>
          </div>

        </div>
      </section>

      {/* ANNOUNCEMENTS SECTION */}
      <section id="announcements" className="scroll-mt-28 px-6 py-24">
        <div className="mx-auto max-w-7xl">

          <p className="mb-5 text-sm uppercase tracking-[0.3em] text-[#66836b]">
            Stay Updated
          </p>

          <h2 className="mb-8 text-4xl font-bold md:text-6xl">
            Latest Updates.
          </h2>

          <p className="mb-12 max-w-2xl leading-relaxed text-gray-600">
            Important updates, reminders, and official
            announcements about Youth Camp 2027 will be
            shared here. Visit this section regularly for news.
          </p>

          <div className="flex min-h-64 items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 p-8 text-center">
            <div>
              <h3 className="mb-3 text-xl font-semibold">
                Announcements Coming Soon
              </h3>
              <p className="max-w-md text-sm leading-relaxed text-gray-500">
                Official announcement posters and updates
                will be displayed here once they are released.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* REGISTRATION SECTION */}
      <section id="registration" className="scroll-mt-28 bg-[#304b38] px-6 py-20 text-center text-white">
        <div className="mx-auto max-w-3xl">

          <p className="mb-5 text-sm uppercase tracking-[0.3em] text-gray-300">
            Be Part of the Gathering
          </p>

          <h2 className="mb-6 text-4xl font-bold md:text-5xl">
            Join Us at Youth Camp 2027.
          </h2>

          <p className="mb-10 leading-relaxed text-gray-300">
            Register your church and prepare to be part of
            a meaningful time of faith, fellowship, and growth.
          </p>

          <Link
            href="/registration"
            className="inline-block rounded-full bg-white px-8 py-4 font-semibold text-[#304b38] transition hover:bg-gray-200"
          >
            Go to Registration →
          </Link>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#20251f] px-6 py-10 text-center text-sm text-gray-300">
        <p className="font-semibold tracking-wider">YOUTH CAMP 2027</p>
        <p className="mt-2">Growing in Faith</p>

        <div className="mt-6">
          <Link
            href="/admin/login"
            className="text-xs text-gray-500 transition hover:text-white"
          >
            Organizer Access
          </Link>
        </div>

        <p className="mt-5 text-xs text-gray-500">
          © 2027 Youth Camp. All Rights Reserved.
        </p>
      </footer>

    </main>
  );
}
