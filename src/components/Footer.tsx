import Link from "next/link";
import Image from "next/image";

type FooterLink = { label: string; href?: string };

function comingSoonHref(label: string) {
  return `/coming-soon?feature=${encodeURIComponent(label)}`;
}

const COMPANY_LINKS: FooterLink[] = [
  { label: "About Us" },
  { label: "Contact Us" },
  { label: "Careers" },
  { label: "Privacy Policy" },
  { label: "Terms & Conditions" },
];

const TRAVELLER_LINKS: FooterLink[] = [
  { label: "Browse Stays", href: "/browse" },
  { label: "Tour Packages", href: "/packages" },
  { label: "Destinations", href: "/browse" },
  { label: "How It Works" },
  { label: "Support Center" },
];

const POLICY_LINKS: FooterLink[] = [
  { label: "Cancellation Policy" },
  { label: "Refund Policy" },
  { label: "Privacy Policy" },
  { label: "Terms & Conditions" },
];

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div>
      <p className="text-sm font-semibold text-white">{title}</p>
      <ul className="mt-3 space-y-2 text-sm text-white/60">
        {links.map((l) => (
          <li key={l.label}>
            <Link href={l.href ?? comingSoonHref(l.label)} className="transition hover:text-white">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="bg-ink text-white">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-5">
        <div className="sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2">
            <Image
              src="/lg.jpeg"
              alt="Travel Grid India"
              width={32}
              height={32}
              className="rounded-lg object-cover"
            />
            <span className="font-display text-lg font-bold">
              Travel<span className="text-accent">Grid</span> India
            </span>
          </div>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/60">
            Your trusted travel partner for exploring Northeast India. Explore. Stay. Travel.
            Change.
          </p>
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs text-white/70">
            Follow us on Instagram
            <span className="font-medium text-white">@travelgridindia07</span>
          </div>
        </div>

        <FooterColumn title="Company" links={COMPANY_LINKS} />
        <FooterColumn title="For Travellers" links={TRAVELLER_LINKS} />
        <FooterColumn title="Policies" links={POLICY_LINKS} />

        <div>
          <p className="text-sm font-semibold text-white">Contact Us</p>
          <ul className="mt-3 space-y-2.5 text-sm text-white/60">
            <li className="flex items-center gap-2">
              <PhoneIcon />
              <a href="tel:+918638163192" className="transition hover:text-white">
                +91 86381 63192
              </a>
            </li>
            <li className="flex items-center gap-2">
              <MailIcon />
              <a href="mailto:support@travelgridindia.com" className="transition hover:text-white">
                support@travelgridindia.com
              </a>
            </li>
            <li className="flex items-center gap-2">
              <GlobeIcon />
              www.travelgridindia.com
            </li>
            <li className="flex items-center gap-2">
              <PinIcon />
              Dibrugarh, Assam, India
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-5 text-center text-xs text-white/50">
        © {new Date().getFullYear()} Travel Grid India. All Rights Reserved.
      </div>
    </footer>
  );
}

function iconProps() {
  return {
    className: "h-3.5 w-3.5 shrink-0 text-white/50",
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth: 1.8,
  };
}

function PhoneIcon() {
  return (
    <svg {...iconProps()}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.5 4h3l1.5 4-2 1.5a11 11 0 005 5l1.5-2 4 1.5v3a2 2 0 01-2.2 2A17 17 0 012.5 6.2 2 2 0 014.5 4z"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg {...iconProps()}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="1.5" strokeLinecap="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 6.5l7.5 6 7.5-6" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg {...iconProps()}>
      <circle cx="12" cy="12" r="8.5" />
      <path strokeLinecap="round" d="M3.5 12h17M12 3.5a13 13 0 010 17M12 3.5a13 13 0 000 17" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg {...iconProps()}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21s7-6.5 7-11.5A7 7 0 105 9.5C5 14.5 12 21 12 21z"
      />
      <circle cx="12" cy="9.5" r="2.2" />
    </svg>
  );
}
