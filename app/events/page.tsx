import type { Metadata } from "next";
import Image from "next/image";
import { IconArrowRight } from "symbols-react";
import { LumaLogo } from "@/components/luma-logo";
import { SiteHeader } from "@/components/site-header";
import { LINKS } from "@/lib/links";

export const metadata: Metadata = {
  title: "Solana Events in the Netherlands",
  description:
    "Join Superteam NL (STNL) for Solana events in the Netherlands: community meetups, build stations and demo days. Find upcoming gatherings and RSVP.",
  alternates: { canonical: "/events" },
};

export default function EventsPage() {
  return (
    <main className="flex min-h-dvh w-full flex-1 flex-col">
      {/* Mobile-only banner (bottom crop of the sidebar illustration),
          mirroring the About page's mobile image placement */}
      <div
        aria-hidden="true"
        className="relative h-[36vh] w-full [mask-image:linear-gradient(to_bottom,black_55%,transparent_100%)] min-[900px]:hidden"
      >
        <Image
          src="/landing/city-illustration.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-bottom"
        />
      </div>
      <div className="px-6 pt-6 min-[900px]:px-14 min-[900px]:pt-[30px]">
        <SiteHeader active="events" />
      </div>
      <div className="grid grid-cols-1 gap-x-[60px] px-6 pb-16 pt-8 min-[900px]:grid-cols-[330px_minmax(0,1fr)] min-[900px]:px-14 min-[900px]:pt-[54px]">
        {/* Sidebar */}
        <div className="mb-10 flex w-full flex-col gap-[22px] min-[900px]:mb-0">
          <h1 className="font-serif text-[52px]/[0.98] font-normal tracking-[-0.01em] text-ink min-[900px]:text-[72px]/[0.98]">
            What&apos;s <em className="italic text-orange">on</em>
          </h1>
          <p className="text-base/[1.5] text-subtle [text-wrap:pretty]">
            Every Superteam NL gathering, in one calendar.
          </p>
          <div className="relative mt-2 hidden h-[420px] overflow-hidden rounded-2xl min-[900px]:block">
            <Image
              src="/landing/city-illustration.png"
              alt=""
              fill
              sizes="330px"
              className="object-cover object-bottom"
            />
          </div>
        </div>

        {/* The calendar lives on Luma. The card keeps its content height
            (self-start) so the link is no larger than what it shows, and only
            the arrow reacts to hover, the way the site's ink buttons do. */}
        <a
          href={LINKS.events}
          target="_blank"
          rel="noreferrer"
          className="group flex flex-col gap-8 self-start rounded-[18px] bg-ink px-[30px] py-[30px] text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2 focus-visible:ring-offset-cream min-[900px]:px-11 min-[900px]:py-10"
        >
          <LumaLogo className="h-[26px] w-[71px]" />
          <span className="max-w-[17em] font-serif text-[34px]/[1.08] tracking-[-0.01em] [text-wrap:pretty] min-[900px]:text-[44px]/[1.06]">
            Visit the Superteam NL Luma page to see and join upcoming events
          </span>
          <span
            aria-hidden="true"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-cream text-ink transition-colors duration-200 group-hover:bg-orange group-hover:text-cream"
          >
            <IconArrowRight fill="currentColor" className="h-[13px] w-[16px]" />
          </span>
          <span className="sr-only"> (opens in new tab)</span>
        </a>
      </div>
    </main>
  );
}
