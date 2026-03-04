import BrandLogo from './BrandLogo';

export default function AuthShell({
  eyebrow,
  title,
  subtitle,
  sideTitle,
  sideCopy,
  highlights,
  footer,
  children,
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-transparent px-4 py-6 md:px-6 md:py-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8rem] top-[-5rem] h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(26,182,108,0.22),_transparent_65%)] blur-2xl" />
        <div className="absolute right-[-6rem] top-12 h-80 w-80 rounded-full bg-[radial-gradient(circle,_rgba(21,169,231,0.2),_transparent_68%)] blur-2xl" />
        <div className="absolute bottom-[-8rem] left-1/3 h-80 w-80 rounded-full bg-[radial-gradient(circle,_rgba(239,59,53,0.12),_transparent_70%)] blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-white/70 bg-white/70 shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur-xl lg:grid-cols-[1.05fr_0.95fr]">
          <section className="relative hidden overflow-hidden bg-[linear-gradient(145deg,var(--brand-navy),#0f2f74_48%,var(--brand-cyan))] p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div className="absolute inset-0">
              <div className="absolute right-[-4rem] top-[-2rem] h-40 w-40 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute bottom-[-3rem] left-[-1rem] h-52 w-52 rounded-full bg-[rgba(26,182,108,0.18)] blur-2xl" />
            </div>

            <div className="relative">
              <BrandLogo />
            </div>

            <div className="relative">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.4em] text-white/65">{eyebrow}</p>
              <h1 className="mt-4 max-w-md text-4xl font-semibold tracking-[-0.05em]">{sideTitle}</h1>
              <p className="mt-4 max-w-md text-base leading-8 text-white/78">{sideCopy}</p>

              <div className="mt-8 grid gap-3">
                {highlights.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/12 bg-white/8 px-4 py-3 text-sm text-white/85 backdrop-blur-sm"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="p-6 sm:p-8 md:p-10">
            <div className="lg:hidden">
              <BrandLogo />
            </div>

            <div className="mt-8 lg:mt-0">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.34em] text-slate-400">{eyebrow}</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-900">{title}</h2>
              <p className="mt-2 text-sm leading-7 text-slate-500">{subtitle}</p>
            </div>

            <div className="mt-8">{children}</div>

            {footer ? <div className="mt-8">{footer}</div> : null}
          </section>
        </div>
      </div>
    </div>
  );
}
