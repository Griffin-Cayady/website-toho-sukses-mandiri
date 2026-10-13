'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRightIcon } from '@phosphor-icons/react';
import Reveal from '@/components/Reveal';
import { useSupabase } from '@/contexts/SupabaseContext.jsx';

// The product categories as linked rows, read from the category table (used on the About page).
const CategoryList = () => {
  const { divisions } = useSupabase();
  return (
    <ul className="space-y-3">
      {divisions.map((division, i) => (
        <Reveal as="li" key={division.slug} delay={i * 80}>
          <Link
            href={division.path}
            className="group flex items-center gap-4 rounded-2xl bg-gray-50 p-3 ring-1 ring-gray-200 transition-[background-color,box-shadow] duration-300 hover:bg-white hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 sm:gap-5 sm:p-4"
          >
            <img
              src={division.thumb}
              alt=""
              className="h-16 w-16 shrink-0 rounded-xl object-cover sm:h-20 sm:w-20"
              loading="lazy"
            />
            <span className="min-w-0 flex-1">
              <span className="block text-base font-bold text-gray-900 transition-colors group-hover:text-brand-700 sm:text-lg">
                {division.name}
              </span>
              <span className="mt-0.5 block text-sm leading-snug text-gray-600">{division.menuBlurb}</span>
            </span>
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-gray-500 ring-1 ring-gray-200 transition-[background-color,color,transform] duration-300 group-hover:translate-x-0.5 group-hover:bg-brand-600 group-hover:text-white group-hover:ring-brand-600"
              aria-hidden="true"
            >
              <ArrowRightIcon className="h-4 w-4" weight="bold" />
            </span>
          </Link>
        </Reveal>
      ))}
    </ul>
  );
};

export default CategoryList;
