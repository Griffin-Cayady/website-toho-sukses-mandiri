import React from 'react';
import Reveal from '@/components/Reveal';
import { OIL_CERTIFICATIONS as certifications } from '@/lib/productInfo';
// Inlined data URIs (imported only here, so other pages don't carry them).
import * as certLogos from '@/lib/certLogos';

// Trust band at the top of the oil category page (/kategori/?id=1): certifications and clients that apply to the oil & lubricant products.
const clients = [
  'Toyota Motor Manufacturing Indonesia',
  'Astra Daihatsu Motor',
  'Astra Honda Motor',
  'Honda Prospect Motor',
  'Mitsubishi Motors Krama Yudha',
  'Suzuki Indomobil',
  'Selamat Sempurna Tbk',
  'Krakatau Steel Sumikin',
  'Panasonic Gobel Life Solution',
  'Omron Manufacturing of Indonesia',
];

const OilHighlights = () => (
  <section aria-labelledby="oil-heading" className="relative isolate overflow-hidden bg-brand-950 text-white">
    <div className="bg-dots-light pointer-events-none absolute inset-0 -z-10 opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden="true" />
    <div className="absolute -left-40 -top-40 -z-10 h-[30rem] w-[30rem] rounded-full bg-brand-600/30 blur-3xl" aria-hidden="true" />

    <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 md:pt-14 lg:px-8">
      <Reveal className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between md:gap-10">
        <div>
          <p className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-brand-200">
            <span className="h-2 w-2 rounded-full bg-sun" aria-hidden="true" />
            Oli & pelumas
          </p>
          <h1 id="oil-heading" className="text-3xl font-extrabold leading-[1.1] tracking-tight [text-wrap:balance] md:text-4xl">
            Pelumas industri bersertifikat
          </h1>
        </div>
        <p className="max-w-md text-[15px] leading-relaxed text-white/75 md:pb-1 md:text-right">
          Bersertifikat mutu dan lingkungan, dan dipakai lebih dari 100 perusahaan di Indonesia.
        </p>
      </Reveal>

      {/* Certifications span the full content width */}
      <ul className="mt-8 grid grid-cols-3 gap-2 sm:gap-4" aria-label="Sertifikasi">
        {certifications.map((cert, i) => (
          <Reveal
            as="li"
            key={cert.name}
            delay={100 + i * 90}
            className="group flex flex-col items-start gap-3 rounded-2xl bg-white/[0.06] p-3 ring-1 ring-inset ring-white/15 transition-colors duration-300 hover:bg-white/[0.1] sm:flex-row sm:items-center sm:gap-4 sm:p-5 lg:p-6"
          >
            {/* White-on-transparent logo sits straight on the dark band. The name beside it is the text label. */}
            <img
              src={certLogos[cert.id]}
              alt=""
              width={160}
              height={160}
              className="h-14 w-14 shrink-0 object-contain opacity-90 transition duration-500 ease-out-expo group-hover:scale-105 group-hover:opacity-100 sm:h-20 sm:w-20"
            />
            <span className="min-w-0">
              <span className="block text-sm font-bold tabular-nums leading-tight sm:text-lg">{cert.name}</span>
              <span className="mt-0.5 block text-[11px] leading-tight text-white/65 sm:text-sm">{cert.desc}</span>
            </span>
          </Reveal>
        ))}
      </ul>
    </div>

    {/* Client strip: full browser width. Scrolls when motion is allowed (see .marquee in globals.css); otherwise a static wrapped list. */}
    <div className="mt-8 border-t border-white/10 md:mt-10">
      <Reveal delay={200} className="mx-auto max-w-7xl px-4 pt-6 text-center sm:px-6 lg:px-8">
        <p id="klien" className="scroll-mt-24 text-sm font-semibold text-white/85 md:text-base">
          Dipercaya <span className="font-extrabold text-sun">100+ perusahaan</span> di Indonesia
        </p>
      </Reveal>
      <Reveal
        delay={260}
        className="marquee overflow-hidden pb-7 pt-5 motion-safe:[mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]"
      >
        <div className="marquee-track">
          {[false, true].map((duplicate) => (
            <ul
              key={String(duplicate)}
              aria-hidden={duplicate || undefined}
              aria-label={duplicate ? undefined : 'Klien kami'}
              className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 px-4 motion-safe:flex-nowrap motion-safe:px-0 motion-safe:pr-6"
            >
              {clients.map((client) => (
                <li key={client} className="flex shrink-0 items-center gap-6">
                  <span className="whitespace-nowrap text-base font-bold tracking-tight text-white/90 md:text-lg">{client}</span>
                  <span className="h-1.5 w-1.5 rounded-sm bg-sun" aria-hidden="true" />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </Reveal>
    </div>
  </section>
);

export default OilHighlights;
