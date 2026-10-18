import Link from 'next/link';
import { ArrowLeftIcon } from '@phosphor-icons/react/dist/ssr';
import { COMPANY } from '@/lib/company';

export const metadata = {
  title: 'Kebijakan Privasi | Toho Sukses Mandiri',
  description: 'Bagaimana CV Toho Sukses Mandiri mengumpulkan dan menggunakan data yang Anda kirim melalui situs ini.',
};

const sections = [
  {
    title: 'Data yang kami kumpulkan',
    body: 'Saat Anda mengisi formulir kontak, kami menerima nama, nomor telepon, alamat email, dan isi pesan Anda. Situs ini tidak memakai akun pengguna dan tidak memasang cookie pelacak iklan.',
  },
  {
    title: 'Cara kami menggunakan data',
    body: 'Data tersebut hanya kami gunakan untuk membalas pertanyaan Anda, menyiapkan penawaran harga, dan menindaklanjuti kebutuhan Anda. Kami tidak menjual atau menyewakan data Anda kepada pihak lain.',
  },
  {
    title: 'Penyimpanan data',
    body: 'Pesan dari formulir kontak disimpan di database pada server hosting kami (Hostinger) yang kami gunakan untuk mengelola permintaan pelanggan. Akses ke data ini dibatasi untuk tim kami.',
  },
  {
    title: 'Hak Anda',
    body: `Anda dapat meminta kami menampilkan, memperbaiki, atau menghapus data yang pernah Anda kirim. Kirim permintaan ke ${COMPANY.email} atau telepon ${COMPANY.phoneDisplay}.`,
  },
];

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 pb-28 pt-14 sm:px-6 md:pt-20">
      <Link href="/" className="group inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-brand-700">
        <ArrowLeftIcon className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" weight="bold" aria-hidden="true" />
        Kembali ke beranda
      </Link>
      <h1 className="mt-8 text-4xl font-extrabold tracking-tight text-gray-900 md:text-5xl">Kebijakan privasi</h1>
      <p className="mt-5 text-lg leading-relaxed text-gray-600">
        Halaman ini menjelaskan data apa yang diterima {COMPANY.name} melalui situs ini dan bagaimana data tersebut digunakan.
      </p>
      <div className="mt-12 space-y-10 border-t border-gray-200 pt-10">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-xl font-bold tracking-tight text-gray-900">{section.title}</h2>
            <p className="mt-3 max-w-[65ch] leading-relaxed text-gray-600">{section.body}</p>
          </section>
        ))}
      </div>
    </article>
  );
}
