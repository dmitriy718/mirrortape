import { useEffect, useSyncExternalStore } from 'react';
import { market, type SymbolState } from '@/lib/marketEngine';

/**
 * Hook into the singleton simulated market engine. Starts the engine on
 * first use; all consumers share the same tick state so prices stay
 * consistent across the ticker tape, watchlist, and charts.
 */
export function useSimulatedMarket() {
  useEffect(() => {
    market.start();
  }, []);
  useSyncExternalStore(market.subscribe, market.getVersion);
  return market;
}

export function useSymbolState(symbol: string): SymbolState {
  useSimulatedMarket();
  return market.get(symbol);
}
