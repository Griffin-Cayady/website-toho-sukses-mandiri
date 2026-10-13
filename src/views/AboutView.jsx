import React from 'react';
import Link from 'next/link';
import {
  ArrowRightIcon,
  SealCheckIcon,
  TruckIcon,
  WrenchIcon,
  CalendarCheckIcon,
  ThumbsUpIcon,
  HeadsetIcon,
} from '@phosphor-icons/react/dist/ssr';
import { Button } from '@/components/ui/button';
import Reveal from '@/components/Reveal';
import CountUp from '@/components/CountUp';
import { COMPANY, YEARS_IN_BUSINESS } from '@/lib/company';
import { IMAGES } from '@/lib/images';
import CategoryShowcase from '@/components/CategoryShowcase';

const benefits = [
  { icon: SealCheckIcon, text: 'Produk asli dari pemasok resmi' },
  { icon: WrenchIcon, text: 'Konsultasi spesifikasi' },
  { icon: TruckIcon, text: 'Pengiriman tepat waktu' },
];

const stats = [
  { icon: CalendarCheckIcon, number: `${YEARS_IN_BUSINESS}+`, label: 'Tahun pengalaman' },
  { icon: ThumbsUpIcon, number: '98%', label: 'Tingkat kepuasan' },
  { icon: HeadsetIcon, number: '24/7', label: 'Layanan pelanggan' },
];

const steps = [
  { title: 'Konsultasi', text: 'Ceritakan mesin, material, atau pekerjaan Anda. Kami cocokkan dengan produk dan spesifikasi yang tepat.' },
  { title: 'Penawaran', text: 'Anda menerima penawaran tertulis untuk semua kategori sekaligus, lengkap dengan ketersediaan stok.' },
  { title: 'Pengiriman', text: 'Barang dikirim dari Jakarta ke pabrik, pelabuhan, atau lokasi proyek sesuai jadwal yang disepakati.' },
  { title: 'Pendampingan', text: 'Setelah barang tiba, tim kami tetap bisa dihubungi untuk pertanyaan pemakaian dan pesanan ulang.' },
];

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: COMPANY.name,
  url: 'https://tohosuksesmandiri.com',
  logo: 'https://tohosuksesmandiri.com/images/logo-tsm.png',
  description: 'Distributor dan pemasok kebutuhan industri untuk pabrik, galangan kapal, dan perkebunan di Indonesia.',
  foundingDate: String(COMPANY.foundedYear),
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Jl. Hayam Wuruk, Gedung HWI Lindeteves Lt. 1 CKS-024',
    addressLocality: 'Jakarta Barat',
    addressCountry: 'ID',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+62-21-2262-4033',
    contactType: 'customer service',
    email: COMPANY.email,
  },
};

const AboutView = () => {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />

      {/* Hero: green-tinted photo background with the intro, benefits and company figures in one block */}
      <section className="relative isolate flex flex-col justify-end overflow-hidden bg-brand-950 md:min-h-[720px]">
        <img
          src={IMAGES.aboutHero}
          alt="Gudang distribusi dengan rak penyimpanan bertingkat"
          className="absolute inset-0 -z-10 h-full w-full object-cover"
          fetchPriority="high"
        />
        <div className="absolute inset-0 -z-10 bg-brand-800/40 mix-blend-multiply" aria-hidden="true" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-brand-950 via-brand-950/75 to-brand-950/10" aria-hidden="true" />
        <div className="bg-dots-light pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-2/5 opacity-40 [mask-image:linear-gradient(to_top,black,transparent)]" aria-hidden="true" />

        <div className="mx-auto w-full max-w-7xl px-4 pt-28 sm:px-6 md:pt-40 lg:px-8">
          <Reveal>
            <p className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-200">
              <span className="h-2 w-2 rounded-full bg-sun" aria-hidden="true" />
              Tentang {COMPANY.name}
            </p>
            <h1 className="max-w-3xl text-[2.4rem] font-extrabold leading-[1.04] tracking-[-0.035em] text-white sm:text-5xl lg:text-6xl">
              Satu mitra untuk <span className="text-brand-300">kebutuhan industri Anda.</span>
            </h1>
          </Reveal>

          <Reveal delay={100} className="mt-7 grid gap-7 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <p className="max-w-xl text-lg leading-relaxed text-white/80">
                Dari Jakarta, kami memasok lebih dari 100 perusahaan di sektor pertanian, kelautan, dan kebutuhan pabrik.
              </p>
              <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-3">
                {benefits.map((benefit) => (
                  <li key={benefit.text} className="flex items-center gap-2">
                    <benefit.icon className="h-5 w-5 shrink-0 text-sun" weight="duotone" aria-hidden="true" />
                    <span className="text-[15px] font-semibold text-white">{benefit.text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-wrap items-center gap-x-7 gap-y-4 lg:col-span-5 lg:justify-end">
              <Button asChild variant="inverse" size="xl">
                <Link href="/#contact-us">
                  Hubungi kami
                  <ArrowRightIcon className="h-5 w-5" weight="bold" aria-hidden="true" />
                </Link>
              </Button>
              <Link href="/products" className="group inline-flex items-center gap-2 font-semibold text-white transition-colors hover:text-sun">
                Lihat produk
                <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" weight="bold" aria-hidden="true" />
              </Link>
            </div>
          </Reveal>

          {/* Company figures along the bottom edge */}
          <dl aria-label="Angka perusahaan" className="mt-12 grid grid-cols-3 gap-x-4 border-t border-white/15 py-7 md:mt-20 md:gap-0 md:divide-x md:divide-white/15 md:py-9">
            {stats.map((stat, i) => (
              <Reveal key={stat.label} delay={180 + i * 80} className="flex flex-col-reverse gap-1 md:px-8 md:first:pl-0">
                <dt className="flex items-center gap-2 text-sm font-medium text-white/70">
                  <stat.icon className="h-4 w-4 shrink-0 text-sun" weight="duotone" aria-hidden="true" />
                  {stat.label}
                </dt>
                <dd>
                  <CountUp value={stat.number} className="text-3xl font-extrabold tabular-nums leading-none tracking-tight text-white md:text-4xl" />
                </dd>
              </Reveal>
            ))}
          </dl>
        </div>
      </section>

      {/* Company story: short intro + who we serve, then the categories (same showcase as the home page) */}
      <section aria-labelledby="story-heading" className="pb-24 pt-20 md:pb-28 md:pt-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="mb-10 grid grid-cols-1 gap-8 md:mb-14 lg:grid-cols-12 lg:items-end lg:gap-16">
            <div className="lg:col-span-7">
              <p className="mb-4 text-sm font-semibold text-brand-700">Berdiri sejak {COMPANY.foundedYear}</p>
              <h2 id="story-heading" className="text-3xl font-extrabold leading-[1.05] tracking-tight text-gray-900 [text-wrap:balance] md:text-5xl">
                Mitra pasokan untuk pabrik, galangan, dan lahan pertanian
              </h2>
              <p className="mt-5 max-w-md text-[17px] leading-relaxed text-gray-600">
                Semua kebutuhan dari satu pemasok, jadi Anda cukup berurusan dengan satu kontak.
              </p>
            </div>
          </Reveal>

          <CategoryShowcase />
        </div>
      </section>

      {/* Call to action */}
      <section className="pb-20 md:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="relative overflow-hidden rounded-2xl bg-brand-700 px-6 py-9 text-white sm:px-10 md:py-10">
            <div className="bg-dots-light pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_right,black,transparent_70%)]" aria-hidden="true" />
            <div className="relative grid items-center gap-6 md:grid-cols-[1fr_auto]">
              <div>
                <h3 className="text-2xl font-extrabold tracking-tight md:text-3xl">Bergabung dengan 100+ perusahaan lainnya</h3>
                <p className="mt-2 max-w-xl text-white/85">Satukan pasokan Anda dalam satu penawaran.</p>
              </div>
              <Button asChild variant="inverse" size="lg">
                <Link href="/#contact-us">
                  Minta penawaran
                  <ArrowRightIcon className="h-4 w-4" weight="bold" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* How we work */}
      <section id="cara-kerja" className="scroll-mt-20 bg-gray-50 py-24 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="mb-14 flex flex-col justify-between gap-6 md:mb-20 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="mb-4 text-sm font-semibold text-brand-700">Cara kami bekerja</p>
              <h2 className="text-3xl font-extrabold leading-[1.1] tracking-tight text-gray-900 md:text-[2.75rem]">Dari pertanyaan pertama sampai pesanan ulang</h2>
            </div>
            <Link href="/#contact-us" className="group inline-flex shrink-0 items-center gap-2 font-semibold text-brand-700 transition-colors hover:text-brand-800">
              Mulai dari langkah 1
              <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" weight="bold" aria-hidden="true" />
            </Link>
          </Reveal>

          <Reveal as="ol" className="relative grid gap-10 lg:grid-cols-4 lg:gap-8">
            {/* Connecting line through the nodes on large screens; small screens use per-step segments below */}
            <span className="absolute left-5 right-[calc(25%-2.75rem)] top-5 hidden h-px bg-gray-200 lg:block" aria-hidden="true">
              <span className="timeline-line block h-full w-full origin-left bg-brand-600" />
            </span>

            {steps.map((step, i) => (
              <li key={step.title} className="group relative pl-16 lg:pl-0">
                {i < steps.length - 1 && (
                  <span className="absolute -bottom-10 left-5 top-10 w-px bg-gray-200 lg:hidden" aria-hidden="true">
                    <span className="timeline-line block h-full w-full origin-top bg-brand-600" />
                  </span>
                )}
                <span
                  className="timeline-node absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-bold tabular-nums text-brand-700 ring-2 ring-brand-600 transition-colors duration-300 group-hover:bg-brand-600 group-hover:text-white lg:relative"
                  style={{ '--step-delay': `${300 + i * 220}ms` }}
                >
                  {i + 1}
                </span>
                <h3 className="pt-2 text-lg font-bold text-gray-900 lg:mt-7 lg:pt-0">{step.title}</h3>
                <p className="mt-2 max-w-xs text-[15px] leading-relaxed text-gray-600">{step.text}</p>
              </li>
            ))}
          </Reveal>
        </div>
      </section>
    </>
  );
};

export default AboutView;
