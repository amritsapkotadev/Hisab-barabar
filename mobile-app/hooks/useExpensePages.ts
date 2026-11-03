import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { getDataState, subscribeData } from '@/services/dataClient';
import type { Expense, ExpensePage } from '@/types';

type PageData<T extends ExpensePage> = {
  key: string | undefined;
  page: T | null;
  expenses: Expense[];
};

export function useExpensePages<T extends ExpensePage>(
  fetchPage: (page: number) => Promise<T>,
  cacheKey?: string
) {
  const [data, setData] = useState<PageData<T>>({ key: cacheKey, page: null, expenses: [] });
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const generation = useRef(0);
  const busy = useRef(false);
  const previousFetcher = useRef(fetchPage);
  const previousCacheKey = useRef(cacheKey);
  const pageCache = useRef(new Map<string, { page: T; expenses: Expense[] }>());
  const { online } = useSyncExternalStore(subscribeData, getDataState, getDataState);
  const cachedData = cacheKey === undefined ? undefined : pageCache.current.get(cacheKey);
  const currentData = cacheKey === undefined
    ? data
    : cachedData ?? (data.key === cacheKey ? data : { key: cacheKey, page: null, expenses: [] });

  useEffect(() => () => { generation.current++; }, []);

  const refresh = useCallback(async () => {
    const current = ++generation.current;
    if (previousFetcher.current !== fetchPage || previousCacheKey.current !== cacheKey) {
      previousFetcher.current = fetchPage;
      previousCacheKey.current = cacheKey;
      const cached = cacheKey === undefined ? undefined : pageCache.current.get(cacheKey);
      setData(cached
        ? { key: cacheKey, ...cached }
        : { key: cacheKey, page: null, expenses: [] });
    }
    busy.current = true;
    setLoadingMore(false);
    setError(null);
    try {
      const next = await fetchPage(1);
      if (current !== generation.current) return;
      const nextData = { key: cacheKey, page: next, expenses: next.data };
      if (cacheKey !== undefined) pageCache.current.set(cacheKey, nextData);
      setData(nextData);
    } catch (failure) {
      if (current !== generation.current) return;
      setError(failure instanceof Error ? failure.message : 'Could not load expenses. Please retry.');
      throw failure;
    } finally {
      if (current === generation.current) busy.current = false;
    }
  }, [cacheKey, fetchPage]);

  const loadMore = async () => {
    if (busy.current || !currentData.page?.pageInfo.nextPage) return;
    busy.current = true;
    const current = generation.current;
    const nextPage = currentData.page.pageInfo.nextPage;
    const existingExpenses = currentData.expenses;
    setLoadingMore(true);
    setError(null);
    try {
      const next = await fetchPage(nextPage);
      if (current !== generation.current) return;
      const merged = new Map(existingExpenses.map(expense => [expense.id, expense]));
      next.data.forEach(expense => merged.set(expense.id, expense));
      const nextData = { key: cacheKey, page: next, expenses: [...merged.values()] };
      if (cacheKey !== undefined) pageCache.current.set(cacheKey, nextData);
      setData(nextData);
    } catch (failure) {
      if (current === generation.current) {
        setError(failure instanceof Error ? failure.message : 'Could not load more expenses. Please retry.');
      }
    } finally {
      if (current === generation.current) {
        busy.current = false;
        setLoadingMore(false);
      }
    }
  };

  const hasCachedData = (key: string) => pageCache.current.has(key) ||
    (data.key === key && data.page !== null);

  return {
    page: currentData.page,
    expenses: currentData.expenses,
    refresh,
    loadMore,
    loadingMore,
    error,
    online,
    hasCachedData,
  };
}
