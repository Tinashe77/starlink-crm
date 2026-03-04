import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  MapPin,
  Rocket,
  Router,
  School,
  ShieldCheck,
  Sparkles,
  Store,
  Waves,
} from 'lucide-react';
import BrandLogo from '../components/BrandLogo';

const highlights = [
  'High-speed satellite internet',
  'Professional installation included',
  'Flexible 8-week payment plan',
  'Coverage even in remote areas',
];

const benefitBullets = [
  'Reliable high-speed internet',
  'Low latency for video calls and streaming',
  'Professional installation',
  'Simple weekly payment plan',
  'Dedicated customer support',
];

const steps = [
  {
    title: 'Apply Online',
    description:
      'Complete the quick application form and choose the package that suits you.',
    tone: 'blue',
  },
  {
    title: 'Installation',
    description:
      'Our technicians install and configure your Starlink equipment.',
    tone: 'green',
  },
  {
    title: 'Flexible Payments',
    description:
      'Pay your balance over 8 weeks with simple weekly installments.',
    tone: 'gold',
  },
];

const packages = [
  {
    name: 'Diaspora Connect',
    tag: 'Perfect for homes and families',
    description:
      'Reliable high-speed internet designed for residential users who want uninterrupted connectivity for work, entertainment and communication.',
    idealFor: ['Homes and families', 'Streaming and browsing', 'Remote work', 'Video calls'],
    includes: ['Starlink equipment', 'Professional installation', '8-week payment plan'],
    icon: Router,
    accent: 'from-[var(--brand-cyan)]/16 via-white to-white',
  },
  {
    name: 'Business Essential',
    tag: 'Reliable internet for small businesses',
    description:
      'Designed for small to medium businesses that need stable internet for daily operations.',
    idealFor: ['Retail shops', 'Offices', 'Small businesses', 'Online operations'],
    includes: ['Starlink business setup', 'Installation by certified technicians', 'Flexible installment plan'],
    icon: Store,
    accent: 'from-[var(--brand-green)]/16 via-white to-white',
  },
  {
    name: 'EduConnect',
    tag: 'Empowering schools with connectivity',
    description:
      'Built specifically for schools and educational institutions to enable digital learning and research.',
    idealFor: ['Schools', 'Colleges', 'Training centers', 'Educational institutions'],
    includes: ['Reliable internet for students and staff', 'Professional installation', 'Affordable installment payments'],
    icon: School,
    accent: 'from-[var(--brand-gold)]/18 via-white to-white',
  },
  {
    name: 'Business Premium',
    tag: 'High-performance internet for growing enterprises',
    description:
      'A powerful connectivity solution for organizations that demand higher bandwidth and reliability.',
    idealFor: ['Corporate offices', 'Large businesses', 'High-traffic networks', 'Enterprise operations'],
    includes: ['Starlink enterprise installation', 'Priority setup', 'Flexible payment structure'],
    icon: Waves,
    accent: 'from-[var(--brand-red)]/12 via-white to-white',
  },
];

const trustPoints = [
  'Fast and reliable satellite internet',
  'Flexible payment plans',
  'Professional installation team',
  'Support throughout your contract',
  'Connectivity even in remote areas',
];

const faqs = [
  {
    question: 'How does the 8-week payment plan work?',
    answer:
      'Once your application is approved, you pay the required deposit and then clear the remaining balance over 8 simple weekly installments.',
  },
  {
    question: 'Do you install in remote areas?',
    answer:
      'Yes. StarConnect Africa is built for homes, businesses, and schools where traditional providers often struggle, including remote coverage areas.',
  },
  {
    question: 'What happens after I apply?',
    answer:
      'Our team reviews your application, confirms your selected package, and schedules installation once approval is complete.',
  },
  {
    question: 'Which payment methods are accepted?',
    answer:
      'Payments can be made via EcoCash and other approved payment methods supported by the team during onboarding.',
  },
];

const partners = ['Homes', 'Businesses', 'Schools', 'Remote Sites'];

function SectionHeading({ eyebrow, title, subtitle, centered = true }) {
  return (
    <div className={centered ? 'mx-auto max-w-3xl text-center' : ''}>
      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.36em] text-[var(--brand-cyan)]">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-900 md:text-5xl">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-4 text-sm leading-8 text-slate-500 md:text-base">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

function ToneBadge({ children, tone = 'blue' }) {
  const styles = {
    blue: 'border-[var(--brand-cyan)]/18 bg-[rgba(21,169,231,0.09)] text-[var(--brand-navy)]',
    green: 'border-[var(--brand-green)]/18 bg-[rgba(26,182,108,0.09)] text-[#0d6b45]',
    gold: 'border-[var(--brand-gold)]/20 bg-[rgba(242,187,46,0.12)] text-[#8b6711]',
  };

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.24em] ${styles[tone]}`}>
      {children}
    </span>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-transparent text-slate-900">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,_rgba(21,169,231,0.08),_transparent_54%)]" />
        <div className="absolute left-[-8rem] top-20 h-80 w-80 rounded-full bg-[radial-gradient(circle,_rgba(26,182,108,0.16),_transparent_64%)] blur-3xl" />
        <div className="absolute right-[-8rem] top-10 h-96 w-96 rounded-full bg-[radial-gradient(circle,_rgba(21,169,231,0.18),_transparent_68%)] blur-3xl" />
        <div className="absolute bottom-[-12rem] left-1/3 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,_rgba(239,59,53,0.08),_transparent_68%)] blur-3xl" />
      </div>

      <header className="px-4 pt-4 md:px-6 md:pt-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between rounded-[2rem] border border-white/70 bg-white/80 px-5 py-4 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl md:px-6">
          <BrandLogo />
          <div className="hidden items-center gap-2 md:flex">
            <a
              href="#how-it-works"
              className="rounded-2xl px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-[var(--brand-navy)]"
            >
              How It Works
            </a>
            <a
              href="#packages"
              className="rounded-2xl px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-[var(--brand-navy)]"
            >
              Packages
            </a>
            <a
              href="#faq"
              className="rounded-2xl px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-[var(--brand-navy)]"
            >
              FAQ
            </a>
            <Link
              to="/login"
              className="rounded-2xl border border-slate-200/80 bg-white px-4 py-2 text-sm font-semibold text-[var(--brand-navy)] shadow-sm transition hover:border-[var(--brand-cyan)]/30 hover:text-[var(--brand-cyan)]"
            >
              Portal Login
            </Link>
          </div>
        </div>
      </header>

      <main className="px-4 pb-12 pt-6 md:px-6 md:pt-8">
        <section className="mx-auto max-w-6xl">
          <div className="rounded-[2.5rem] border border-white/70 bg-white/82 px-6 py-7 shadow-[0_28px_70px_rgba(15,23,42,0.1)] backdrop-blur-xl md:px-8 md:py-8">
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <ToneBadge>Starlink Made Accessible</ToneBadge>
                <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-[-0.06em] text-slate-900 md:text-6xl md:leading-[1.02]">
                  Get Starlink Internet Installed Today <span className="brand-gradient-text">Pay Over 8 Weeks</span>
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
                  Fast, reliable satellite internet for homes, businesses and schools. Apply today and
                  enjoy professional installation with flexible weekly payments.
                </p>

                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  {highlights.map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-3 text-sm font-medium text-slate-700"
                    >
                      <CheckCircle2 size={18} className="text-[var(--brand-green)]" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[var(--brand-navy)] to-[var(--brand-cyan)] px-6 py-4 text-sm font-semibold text-white shadow-[0_20px_34px_rgba(23,63,143,0.24)] transition hover:translate-y-[-1px]"
                  >
                    Apply Now <ArrowRight size={16} />
                  </Link>
                  <a
                    href="#packages"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200/80 bg-white px-6 py-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-[var(--brand-cyan)]/30 hover:text-[var(--brand-navy)]"
                  >
                    View Packages
                  </a>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="rounded-[2rem] border border-white/12 bg-[linear-gradient(145deg,var(--brand-navy),#0f2f74_48%,var(--brand-cyan))] p-6 text-white shadow-[0_28px_60px_rgba(23,63,143,0.2)]">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.34em] text-white/65">
                    Why Starlink?
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em]">
                    Experience the Power of Satellite Internet
                  </h2>
                  <p className="mt-4 text-sm leading-7 text-white/78">
                    StarConnect Africa brings the power of Starlink satellite internet to homes,
                    businesses and schools across the region. Whether you are in the city or in a
                    remote area, Starlink delivers high-speed, low-latency internet where traditional
                    providers cannot.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {benefitBullets.map((item) => (
                    <div
                      key={item}
                      className="rounded-[1.6rem] border border-slate-200/70 bg-white/85 px-5 py-4 shadow-[0_18px_36px_rgba(15,23,42,0.06)]"
                    >
                      <p className="text-sm font-medium text-slate-700">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-10 max-w-6xl">
          <div className="text-center">
            <p className="text-sm font-medium text-slate-400">Built for modern connectivity across the region</p>
            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
              {partners.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/70 bg-white/65 px-4 py-4 text-sm font-semibold text-slate-400 shadow-[0_14px_28px_rgba(15,23,42,0.04)]"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="mx-auto mt-14 max-w-6xl">
          <SectionHeading
            eyebrow="How It Works"
            title="Simple 3-Step Process"
            subtitle="A clear path from application to installation and flexible payments."
          />

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <div className="rounded-[2.2rem] border border-slate-200/70 bg-white/84 p-6 shadow-[0_22px_44px_rgba(15,23,42,0.06)] lg:col-span-2">
              <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
                <div>
                  <ToneBadge tone="blue">Step 1</ToneBadge>
                  <h3 className="mt-5 text-4xl font-semibold tracking-[-0.05em] text-slate-900">
                    {steps[0].title}
                  </h3>
                  <p className="mt-4 text-sm leading-8 text-slate-600 md:text-base">
                    {steps[0].description}
                  </p>
                </div>

                <div className="rounded-[2rem] border border-slate-200/70 bg-gradient-to-br from-slate-50 to-white p-5">
                  <div className="rounded-[1.3rem] border border-slate-200/70 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                      <span className="h-3 w-3 rounded-full bg-[var(--brand-red)]" />
                      <span className="h-3 w-3 rounded-full bg-[var(--brand-gold)]" />
                      <span className="h-3 w-3 rounded-full bg-[var(--brand-green)]" />
                    </div>
                    <div className="mt-4 space-y-3">
                      <div className="rounded-2xl border border-dashed border-[var(--brand-cyan)]/40 bg-[rgba(21,169,231,0.05)] px-4 py-5 text-sm text-slate-500">
                        Complete the application and choose your package
                      </div>
                      <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm font-medium text-slate-700">
                        Fast onboarding for homes, businesses, and schools
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {steps.slice(1).map((step, index) => (
              <div
                key={step.title}
                className="rounded-[2rem] border border-slate-200/70 bg-white/84 p-6 shadow-[0_22px_44px_rgba(15,23,42,0.06)]"
              >
                <ToneBadge tone={step.tone}>Step {index + 2}</ToneBadge>
                <h3 className="mt-5 text-3xl font-semibold tracking-[-0.05em] text-slate-900">
                  {step.title}
                </h3>
                <p className="mt-4 text-sm leading-8 text-slate-600 md:text-base">
                  {step.description}
                </p>

                <div className="mt-6 rounded-[1.6rem] border border-slate-200/70 bg-gradient-to-br from-slate-50 to-white p-5">
                  <div className="rounded-[1.3rem] border border-slate-200/70 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                      <span className="h-3 w-3 rounded-full bg-[var(--brand-red)]" />
                      <span className="h-3 w-3 rounded-full bg-[var(--brand-gold)]" />
                      <span className="h-3 w-3 rounded-full bg-[var(--brand-green)]" />
                    </div>
                    <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-5 text-sm font-medium text-slate-700">
                      {step.title === 'Installation'
                        ? 'Certified technicians install, align, test, and configure your setup.'
                        : 'Pay the balance over 8 weekly installments with approved payment methods.'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-8 max-w-6xl">
          <div className="rounded-[2.2rem] border border-white/12 bg-[linear-gradient(145deg,#111c70,#132f88_45%,#12489a)] px-6 py-7 text-white shadow-[0_28px_70px_rgba(17,28,112,0.2)] md:px-8">
            <div className="grid gap-6 md:grid-cols-4 md:items-center">
              <div>
                <p className="text-base font-medium text-white/82">StarConnect Africa keeps you connected</p>
              </div>
              <div>
                <p className="text-4xl font-semibold tracking-[-0.04em]">8</p>
                <p className="mt-1 text-sm text-white/70">Weekly payment cycles</p>
              </div>
              <div>
                <p className="text-4xl font-semibold tracking-[-0.04em]">4</p>
                <p className="mt-1 text-sm text-white/70">Specialized package tiers</p>
              </div>
              <div>
                <p className="text-4xl font-semibold tracking-[-0.04em]">1</p>
                <p className="mt-1 text-sm text-white/70">Connected portal for onboarding to collections</p>
              </div>
            </div>
          </div>
        </section>

        <section id="packages" className="mx-auto mt-14 max-w-6xl">
          <SectionHeading
            eyebrow="Packages"
            title="Choose the Package That Fits Your Needs"
            subtitle="Designed for families, small businesses, schools, and growing enterprises."
          />

          <div className="mt-8 grid gap-5 xl:grid-cols-2">
            {packages.map((item) => {
              const PackageIcon = item.icon;

              return (
                <article
                  key={item.name}
                  className={`rounded-[2rem] border border-slate-200/70 bg-gradient-to-br ${item.accent} p-6 shadow-[0_22px_44px_rgba(15,23,42,0.07)]`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-400">
                        {item.tag}
                      </p>
                      <h3 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-slate-900">
                        {item.name}
                      </h3>
                    </div>
                    <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white/90 text-[var(--brand-navy)] shadow-sm">
                      <PackageIcon size={24} />
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-7 text-slate-600">{item.description}</p>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200/70 bg-white/85 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                        Ideal For
                      </p>
                      <ul className="mt-3 space-y-2">
                        {item.idealFor.map((value) => (
                          <li key={value} className="flex items-center gap-2 text-sm text-slate-700">
                            <MapPin size={14} className="text-[var(--brand-cyan)]" />
                            {value}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-2xl border border-slate-200/70 bg-white/85 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                        Includes
                      </p>
                      <ul className="mt-3 space-y-2">
                        {item.includes.map((value) => (
                          <li key={value} className="flex items-center gap-2 text-sm text-slate-700">
                            <CheckCircle2 size={14} className="text-[var(--brand-green)]" />
                            {value}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <Link
                    to="/register"
                    className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-[var(--brand-navy)] shadow-sm transition hover:text-[var(--brand-cyan)]"
                  >
                    Apply for {item.name} <ArrowRight size={16} />
                  </Link>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mx-auto mt-14 max-w-6xl">
          <SectionHeading
            eyebrow="Benefits"
            title="StarConnect Africa Handles the Details"
            subtitle="From professional installation to structured payments, the service is designed to remove friction and keep you online."
          />

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-[2rem] border border-slate-200/70 bg-white/84 p-6 shadow-[0_22px_44px_rgba(15,23,42,0.06)]">
              <h3 className="text-2xl font-semibold tracking-[-0.05em] text-slate-900">Professional Installation</h3>
              <p className="mt-3 text-sm leading-8 text-slate-600">
                Our technicians install the Starlink dish and router, optimize placement, run tests, and guide you through setup.
              </p>
            </div>

            <div className="rounded-[2rem] border border-slate-200/70 bg-white/84 p-6 shadow-[0_22px_44px_rgba(15,23,42,0.06)]">
              <h3 className="text-2xl font-semibold tracking-[-0.05em] text-slate-900">Flexible Payment Options</h3>
              <p className="mt-3 text-sm leading-8 text-slate-600">
                Pay a deposit when approved, then clear the balance over 8 weeks. Once fully paid, ownership is finalized.
              </p>
            </div>

            <div className="rounded-[2rem] border border-slate-200/70 bg-white/84 p-6 shadow-[0_22px_44px_rgba(15,23,42,0.06)]">
              <h3 className="text-2xl font-semibold tracking-[-0.05em] text-slate-900">Support Throughout</h3>
              <p className="mt-3 text-sm leading-8 text-slate-600">
                Dedicated support remains available throughout your contract so you can stay connected with confidence.
              </p>
            </div>

            <div className="rounded-[2rem] border border-slate-200/70 bg-white/84 p-6 shadow-[0_22px_44px_rgba(15,23,42,0.06)] md:col-span-2 xl:col-span-1">
              <h3 className="text-2xl font-semibold tracking-[-0.05em] text-slate-900">Reliable Coverage</h3>
              <p className="mt-3 text-sm leading-8 text-slate-600">
                Connectivity is available even in remote areas where legacy infrastructure cannot keep up.
              </p>
            </div>

            <div className="rounded-[2rem] border border-slate-200/70 bg-gradient-to-br from-white to-slate-50 p-6 shadow-[0_22px_44px_rgba(15,23,42,0.06)] md:col-span-2">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.34em] text-slate-400">
                Why Choose StarConnect Africa?
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {trustPoints.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white px-4 py-3 text-sm font-medium text-slate-700"
                  >
                    <ShieldCheck size={16} className="text-[var(--brand-green)]" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-14 max-w-6xl" id="faq">
          <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
            <div>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.36em] text-[var(--brand-cyan)]">
                Frequently Asked Questions
              </p>
              <h2 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-slate-900">
                Questions customers ask before they get connected
              </h2>
              <p className="mt-4 text-sm leading-8 text-slate-500 md:text-base">
                Here are quick answers to the most common questions about installation, payments, and what happens after you apply.
              </p>
            </div>

            <div className="space-y-3">
              {faqs.map((item, index) => (
                <div
                  key={item.question}
                  className="rounded-[1.6rem] border border-slate-200/70 bg-white/84 p-5 shadow-[0_18px_36px_rgba(15,23,42,0.05)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-xl font-semibold tracking-[-0.04em] text-slate-900">
                      {item.question}
                    </h3>
                    <ChevronDown size={18} className={`mt-1 shrink-0 ${index === 0 ? 'text-[var(--brand-navy)]' : 'text-slate-400'}`} />
                  </div>
                  <p className="mt-3 text-sm leading-8 text-slate-600">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto mt-14 max-w-6xl">
          <div className="overflow-hidden rounded-[2.5rem] border border-white/12 bg-[linear-gradient(145deg,var(--brand-navy),#114a9a_48%,var(--brand-cyan))] px-7 py-8 text-white shadow-[0_30px_80px_rgba(23,63,143,0.2)] md:px-10 md:py-10">
            <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.36em] text-white/65">
                  Ready to Get Connected?
                </p>
                <h2 className="mt-3 text-4xl font-semibold tracking-[-0.05em]">
                  Apply today and start enjoying high-speed Starlink internet.
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-8 text-white/78 md:text-base">
                  Submit your application, our team reviews your details, and installation is scheduled once approved.
                </p>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-semibold text-[var(--brand-navy)] shadow-sm transition hover:text-[var(--brand-cyan)]"
                  >
                    Start Your Application <ArrowRight size={16} />
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/16 bg-white/10 px-6 py-4 text-sm font-semibold text-white transition hover:bg-white/14"
                  >
                    Go to Portal
                  </Link>
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/12 bg-white/10 p-6 backdrop-blur-sm">
                <p className="flex items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.32em] text-white/68">
                  <Rocket size={14} /> What Happens Next?
                </p>
                <div className="mt-5 space-y-4">
                  {[
                    'Submit your application',
                    'Our team reviews your details',
                    'Installation is scheduled once approved',
                  ].map((item, index) => (
                    <div key={item} className="flex items-start gap-4 rounded-2xl bg-white/8 px-4 py-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white text-sm font-semibold text-[var(--brand-navy)]">
                        {index + 1}
                      </div>
                      <p className="text-sm leading-7 text-white/85">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="px-4 pb-8 pt-3 md:px-6">
        <div className="mx-auto max-w-6xl rounded-[2rem] border border-white/70 bg-white/80 px-5 py-5 text-sm leading-7 text-slate-500 shadow-[0_18px_40px_rgba(15,23,42,0.05)] backdrop-blur-xl md:px-6">
          <p>
            By submitting your application, you agree to the service terms and conditions. Applications are subject to approval and availability.
          </p>
        </div>
      </footer>
    </div>
  );
}
