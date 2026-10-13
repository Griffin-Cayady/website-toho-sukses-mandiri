'use client';

import React, { useEffect, useRef, useState } from 'react';

const DURATION = 1400;
const easeOutCubic = (t) => 1 - (1 - t) ** 3;

// Counts the leading number of `value` (e.g. "100+", "98%", "24/7") up from 0 the first time it scrolls
// into view. The server renders the final value, so it is correct without JS and for reduced-motion visitors.
const CountUp = ({ value, className }) => {
  const [, digits = '', suffix = value] = String(value).match(/^(\d+)(.*)$/) || [];
  const target = Number(digits);
  const ref = useRef(null);
  const [current, setCurrent] = useState(target);

  useEffect(() => {
    const node = ref.current;
    if (!node || !digits || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let frame;
    setCurrent(0);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now) => {
          const progress = Math.min(1, (now - start) / DURATION);
          setCurrent(Math.round(easeOutCubic(progress) * target));
          if (progress < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { rootMargin: '0px 0px -10% 0px' }
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [digits, target]);

  return (
    <span ref={ref} className={className} aria-label={String(value)}>
      <span aria-hidden="true">{digits ? current : ''}</span>
      <span aria-hidden="true" className="text-sun">{suffix}</span>
    </span>
  );
};

export default CountUp;
