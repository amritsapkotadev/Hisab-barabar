import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { getDataState, subscribeData } from '@/services/dataClient';
import type { Expense, ExpensePage } from '@/types';

export function useExpensePages<T extends ExpensePage>(fetchPage: (page: number) => Promise<T>) {
  const [page, setPage] = useState<T | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const generation = useRef(0);
  const busy = useRef(false);
  const previousFetcher = useRef(fetchPage);
  const { online } = useSyncExternalStore(subscribeData, getDataState, getDataState);

  useEffect(() => () => { generation.current++; }, []);

  const refresh = useCallback(async () => {
    const current = ++generation.current;
    if (previousFetcher.current !== fetchPage) {
      setPage(null);
      setExpenses([]);
      previousFetcher.current = fetchPage;
    }
    busy.current = true;
    setLoadingMore(false);
    setError(null);
    try {
      const next = await fetchPage(1);
      if (current !== generation.current) return;
      setPage(next);
      setExpenses(next.data);
    } catch (failure) {
      if (current !== generation.current) return;
      setError(failure instanceof Error ? failure.message : 'Could not load expenses. Please retry.');
      throw failure;
    } finally {
      if (current === generation.current) busy.current = false;
    }
  }, [fetchPage]);

  const loadMore = async () => {
    if (busy.current || !page?.pageInfo.nextPage) return;
    busy.current = true;
    const current = generation.current;
    setLoadingMore(true);
    setError(null);
    try {
      const next = await fetchPage(page.pageInfo.nextPage);
      if (current !== generation.current) return;
      setPage(next);
      setExpenses(previous => {
        const merged = new Map(previous.map(expense => [expense.id, expense]));
        next.data.forEach(expense => merged.set(expense.id, expense));
        return [...merged.values()];
      });
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

  return { page, expenses, refresh, loadMore, loadingMore, error, online };
}
