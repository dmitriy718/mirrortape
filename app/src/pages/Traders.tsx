import { useMemo, useState } from 'react';
import PageHeader from '@/pages/traders/PageHeader';
import FilterBar from '@/pages/traders/FilterBar';
import Leaderboard from '@/pages/traders/Leaderboard';
import TraderDrawer from '@/pages/traders/TraderDrawer';
import Verification from '@/pages/traders/Verification';
import { TRADERS } from '@/pages/traders/data';
import type { Instrument, SortKey, Strategy, Trader } from '@/pages/traders/data';

const PAGE_SIZE = 15;
const LOAD_MORE = 10;

/**
 * /traders — verified trader leaderboard with sticky filter/sort/search bar,
 * 15-row table with sparklines + COPY pills, and a slide-in profile drawer.
 */
export default function Traders() {
  const [strategy, setStrategy] = useState<'ALL' | Strategy>('ALL');
  const [instrument, setInstrument] = useState<'ALL' | Instrument>('ALL');
  const [sort, setSort] = useState<SortKey>('ret12m');
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [appendFrom, setAppendFrom] = useState(Infinity);
  const [selected, setSelected] = useState<Trader | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const out = TRADERS.filter(
      (t) =>
        (strategy === 'ALL' || t.strategy === strategy) &&
        (instrument === 'ALL' || t.instrument === instrument) &&
        (!q || t.handle.toLowerCase().includes(q) || t.name.toLowerCase().includes(q)),
    );
    switch (sort) {
      case 'win':
        out.sort((a, b) => b.win - a.win);
        break;
      case 'dd':
        out.sort((a, b) => b.dd - a.dd); // dd is negative: highest (closest to 0) = lowest drawdown
        break;
      case 'followers':
        out.sort((a, b) => b.followers - a.followers);
        break;
      default:
        out.sort((a, b) => b.ret12m - a.ret12m);
    }
    return out;
  }, [strategy, instrument, sort, query]);

  const rows = filtered.slice(0, limit);
  const hasMore = filtered.length > limit;

  return (
    <>
      <PageHeader />
      <FilterBar
        strategy={strategy}
        instrument={instrument}
        sort={sort}
        query={query}
        onStrategy={setStrategy}
        onInstrument={setInstrument}
        onSort={setSort}
        onQuery={setQuery}
      />
      <Leaderboard
        rows={rows}
        total={filtered.length}
        appendFrom={appendFrom}
        onSelect={setSelected}
        onLoadMore={() => {
          setAppendFrom(rows.length);
          setLimit((l) => l + LOAD_MORE);
        }}
        hasMore={hasMore}
      />
      <Verification />
      <TraderDrawer trader={selected} onClose={() => setSelected(null)} />
    </>
  );
}
