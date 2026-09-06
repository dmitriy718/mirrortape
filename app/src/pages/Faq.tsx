import { useEffect, useState } from 'react';
import FaqSearch from '@/pages/faq/FaqSearch';
import FaqGroups from '@/pages/faq/FaqGroups';
import StillStuck from '@/pages/faq/StillStuck';

/**
 * MirrorTape FAQ page (`/faq`). Searchable 24-question hub in 5 categories,
 * per design/faq.md. Global Navbar/Footer come from Layout.
 */
export default function Faq() {
  const [raw, setRaw] = useState('');
  const [query, setQuery] = useState('');

  // 0.15s debounce on the live filter
  useEffect(() => {
    const t = setTimeout(() => setQuery(raw.trim()), 150);
    return () => clearTimeout(t);
  }, [raw]);

  return (
    <>
      <FaqSearch value={raw} onChange={setRaw} />
      <FaqGroups query={query} />
      <StillStuck />
    </>
  );
}
