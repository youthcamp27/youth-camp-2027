
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#faf9f6] text-[#20251f]">

      {/* STICKY NAVIGATION */}
      <nav className="sticky top-0 z-50 border-b border-[#356B66]/15 bg-[#faf9f6]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">

          <a href="#home" className="flex shrink-0 items-center">
            <Image
              src="/images/Logo%20Text.png"
              alt="Spirit Willed Action Team"
              width={1920}
              height={1080}
              className="h-32 w-auto max-w-[720px] object-contain"
              priority
            />
          </a>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-xs font-bold md:text-sm">
            <a href="#home" className="transition hover:text-[#356B66]">Home</a>
            <a href="#about" className="transition hover:text-[#356B66]">About</a>
            <a href="#schedule" className="transition hover:text-[#356B66]">Schedule</a>
            <a href="#announcements" className="transition hover:text-[#356B66]">Announcements</a>

            <Link
              href="/registration"
              className="rounded-lg bg-[#356B66] px-6 py-3 font-bold text-white shadow-md transition hover:bg-[#28534F] hover:shadow-lg"
            >
              Register
            </Link>
          </div>
        </div>
      </nav>

      {/* HOME SECTION */}
      <section
        id="home"
        className="scroll-mt-28 flex min-h-[78vh] items-center bg-[#28534F] px-6 py-24 text-white"
      >
        <div className="mx-auto w-full max-w-7xl">
          <div className="max-w-4xl">

            <p className="mb-7 text-xs font-bold uppercase tracking-[0.35em] text-[#A8C7C2] md:text-sm">
              A Gathering of Faith, Fellowship, and Purpose
            </p>

            <h2 className="mb-8 text-5xl font-extrabold leading-[1.05] tracking-tight md:text-7xl lg:text-8xl">
              A Generation
              <br />
              Rooted in
              <br />
              <span className="text-[#8EADA9]">His Word.</span>
            </h2>

            <p className="mb-10 max-w-xl text-base leading-relaxed text-white/85 md:text-lg">
              Join us for Youth Camp 2027, a special gathering
              dedicated to growing in faith, building friendships,
              and strengthening our walk with God.
            </p>

            <Link
              href="/registration"
              className="inline-block rounded-lg bg-white px-8 py-4 font-bold text-[#28534F] shadow-lg transition hover:-translate-y-1 hover:bg-[#DCE9E6]"
            >
              Register Your Church →
            </Link>

          </div>
        </div>
      </section>

      {/* CAMP INFORMATION */}
      <section className="bg-[#356B66] py-12 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 md:grid-cols-3">

          <div className="border-l-2 border-[#8EADA9] pl-5">
            <p className="mb-2 text-xs font-bold tracking-[0.2em] text-[#B8D0CC]">EVENT</p>
            <h3 className="text-xl font-bold">Youth Camp 2027</h3>
          </div>

          <div className="border-l-2 border-[#8EADA9] pl-5">
            <p className="mb-2 text-xs font-bold tracking-[0.2em] text-[#B8D0CC]">THEME</p>
            <h3 className="text-xl font-bold">To Be Announced</h3>
          </div>

          <div className="border-l-2 border-[#8EADA9] pl-5">
            <p className="mb-2 text-xs font-bold tracking-[0.2em] text-[#B8D0CC]">REGISTRATION</p>
            <h3 className="text-xl font-bold">Coming Soon</h3>
          </div>

        </div>
      </section>

      {/* ABOUT SECTION */}
      <section id="about" className="scroll-mt-28 bg-[#faf9f6] px-6 py-24">
        <div className="mx-auto max-w-7xl">

          <p className="mb-5 text-xs font-bold uppercase tracking-[0.3em] text-[#356B66]">
            Get to Know Us
          </p>

          <h2 className="mb-8 text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
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

            <div className="flex aspect-video items-center justify-center rounded-2xl border border-[#356B66]/15 bg-[#E4EEEB] p-8 text-center shadow-sm">
              <div>
                <p className="mb-2 text-sm font-extrabold tracking-wider text-[#356B66]">
                  MINISTRY VIDEO
                </p>
                <p className="text-sm text-gray-500">
                  Your youth ministry video will appear here.
                </p>
              </div>
            </div>

            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#356B66]">
                Our Ministry
              </p>
              <h3 className="mb-5 text-3xl font-extrabold tracking-tight">
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
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#356B66]">
                The Camp
              </p>
              <h3 className="mb-5 text-3xl font-extrabold tracking-tight">
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

            <div className="order-1 flex aspect-video items-center justify-center rounded-2xl border border-[#356B66]/15 bg-[#E4EEEB] p-8 text-center shadow-sm md:order-2">
              <div>
                <p className="mb-2 text-sm font-extrabold tracking-wider text-[#356B66]">
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
      <section id="schedule" className="scroll-mt-28 bg-[#E4EEEB] px-6 py-24 text-[#20251f]">
        <div className="mx-auto max-w-7xl">

          <p className="mb-5 text-xs font-bold uppercase tracking-[0.3em] text-[#356B66]">
            Plan Your Experience
          </p>

          <h2 className="mb-8 text-4xl font-extrabold tracking-tight md:text-6xl">
            Camp Schedule.
          </h2>

          <p className="mb-12 max-w-2xl leading-relaxed text-gray-600">
            Important dates, activities, and program details
            for Youth Camp 2027 will be published here once
            they are officially finalized.
          </p>

          <div className="grid gap-5 md:grid-cols-3">

            {["Registration Opens", "Registration Deadline", "Camp Dates"].map((item) => (
              <div key={item} className="rounded-xl border border-[#356B66]/15 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                <p className="mb-4 text-xs font-extrabold tracking-[0.15em] text-[#356B66]">
                  {item.toUpperCase()}
                </p>
                <h3 className="text-xl font-bold">To Be Announced</h3>
                <div className="mt-6 h-1 w-12 rounded-full bg-[#719994]" />
              </div>
            ))}

          </div>

          <div className="mt-16 rounded-2xl border border-[#356B66]/15 bg-white p-10 text-center shadow-sm">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#356B66]">
              Official Camp Program
            </p>
            <h3 className="mb-3 text-2xl font-extrabold">
              Coming Soon
            </h3>
            <p className="text-sm text-gray-600">
              The official program and schedule will be posted here.
            </p>
          </div>

        </div>
      </section>

      {/* ANNOUNCEMENTS SECTION */}
      <section id="announcements" className="scroll-mt-28 bg-[#faf9f6] px-6 py-24">
        <div className="mx-auto max-w-7xl">

          <p className="mb-5 text-xs font-bold uppercase tracking-[0.3em] text-[#356B66]">
            Stay Updated
          </p>

          <h2 className="mb-8 text-4xl font-extrabold tracking-tight md:text-6xl">
            Latest Updates.
          </h2>

          <p className="mb-12 max-w-2xl leading-relaxed text-gray-600">
            Important updates, reminders, and official
            announcements about Youth Camp 2027 will be
            shared here. Visit this section regularly for news.
          </p>

          <div className="flex min-h-64 items-center justify-center rounded-2xl border-2 border-dashed border-[#719994] bg-[#E4EEEB]/50 p-8 text-center">
            <div>
              <h3 className="mb-3 text-xl font-extrabold">
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
      <section id="registration" className="scroll-mt-28 bg-[#28534F] px-6 py-24 text-center text-white">
        <div className="mx-auto max-w-3xl">

          <p className="mb-5 text-xs font-bold uppercase tracking-[0.3em] text-[#B8D0CC]">
            Be Part of the Gathering
          </p>

          <h2 className="mb-6 text-4xl font-extrabold tracking-tight md:text-6xl">
            Join Us at Youth Camp 2027.
          </h2>

          <p className="mb-10 leading-relaxed text-white/85">
            Register your church and prepare to be part of
            a meaningful time of faith, fellowship, and growth.
          </p>

          <Link
            href="/registration"
            className="inline-block rounded-lg bg-white px-8 py-4 font-bold text-[#28534F] shadow-lg transition hover:-translate-y-1 hover:bg-[#DCE9E6]"
          >
            Go to Registration →
          </Link>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#20251f] px-6 py-10 text-center text-sm text-gray-300">

        <p className="font-bold tracking-[0.15em]">YOUTH CAMP 2027</p>
        <p className="mt-2 font-medium text-[#8EADA9]">Growing in Faith</p>

        <div className="mt-6">
          <Link
            href="/admin/login"
            className="text-xs text-gray-400 transition hover:text-[#8EADA9]"
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
