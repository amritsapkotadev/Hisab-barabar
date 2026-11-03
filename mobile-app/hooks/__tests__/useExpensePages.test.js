import React from 'react';
import { act, create } from 'react-test-renderer';
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { useExpensePages } from '../useExpensePages';

const mockState = { online: true };
jest.mock('@/services/dataClient', () => ({
  subscribeData: () => () => {},
  getDataState: () => mockState,
}));

let list;
const fetchPage = jest.fn();
function Probe({ fetcher = fetchPage }) {
  list = useExpensePages(fetcher);
  return null;
}
const page = (ids, nextPage = null) => ({
  success: true, data: ids.map(id => ({ id })), summary: { count: 40, totalAmount: 1000 },
  pageInfo: { page: nextPage ? nextPage - 1 : 2, limit: 20, hasMore: nextPage !== null, nextPage },
});

describe('expense page loading', () => {
  let renderer;
  beforeEach(async () => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
    fetchPage.mockReset();
    await act(async () => { renderer = create(<Probe />); });
  });
  afterEach(async () => { await act(async () => renderer.unmount()); });

  it('loads one page, deduplicates append, blocks double taps and resets on refresh', async () => {
    fetchPage.mockResolvedValueOnce(page(['1', '2'], 2));
    await act(async () => list.refresh());
    let finish;
    fetchPage.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    let loading;
    await act(async () => {
      loading = list.loadMore();
      await list.loadMore();
    });
    expect(fetchPage).toHaveBeenCalledTimes(2);
    expect(fetchPage).toHaveBeenLastCalledWith(2);
    await act(async () => { finish(page(['2', '3'])); await loading; });
    expect(list.expenses.map(e => e.id)).toEqual(['1', '2', '3']);
    expect(list.page.summary.count).toBe(40);
    fetchPage.mockResolvedValueOnce(page(['4'], 2));
    await act(async () => list.refresh());
    expect(list.expenses.map(e => e.id)).toEqual(['4']);
    expect(fetchPage).toHaveBeenLastCalledWith(1);
  });

  it('keeps downloaded rows and exposes an unavailable offline page for retry', async () => {
    fetchPage.mockResolvedValueOnce(page(['1'], 2));
    await act(async () => list.refresh());
    fetchPage.mockRejectedValueOnce(new Error('Offline: no saved expense snapshot'));
    await act(async () => list.loadMore());
    expect(list.expenses.map(e => e.id)).toEqual(['1']);
    expect(list.error).toContain('Offline');
    expect(list.page.pageInfo.nextPage).toBe(2);
    fetchPage.mockResolvedValueOnce(page(['2']));
    await act(async () => list.loadMore());
    expect(list.error).toBeNull();
    expect(list.expenses.map(e => e.id)).toEqual(['1', '2']);
  });

  it('blocks load more during overlapping refreshes and resumes from accepted page one', async () => {
    fetchPage.mockResolvedValueOnce(page(['1'], 2));
    await act(async () => list.refresh());
    fetchPage.mockResolvedValueOnce(page(['2'], 3));
    await act(async () => list.loadMore());
    let finishOld;
    let finishNew;
    fetchPage.mockImplementationOnce(() => new Promise(resolve => { finishOld = resolve; }));
    fetchPage.mockImplementationOnce(() => new Promise(resolve => { finishNew = resolve; }));
    let oldRefresh;
    let newRefresh;
    await act(async () => { oldRefresh = list.refresh(); newRefresh = list.refresh(); });
    await act(async () => { finishOld(page(['stale'], 2)); await oldRefresh; });
    await act(async () => list.loadMore());
    expect(fetchPage).toHaveBeenCalledTimes(4);
    await act(async () => { finishNew(page(['fresh'], 2)); await newRefresh; });
    fetchPage.mockResolvedValueOnce(page(['next']));
    await act(async () => list.loadMore());
    expect(fetchPage).toHaveBeenLastCalledWith(2);
    expect(list.expenses.map(e => e.id)).toEqual(['fresh', 'next']);
  });

  it('releases the loading lock after a failed refresh without losing downloaded rows', async () => {
    fetchPage.mockResolvedValueOnce(page(['saved'], 2));
    await act(async () => list.refresh());
    fetchPage.mockRejectedValueOnce(new Error('Offline'));
    await act(async () => { await expect(list.refresh()).rejects.toThrow('Offline'); });
    expect(list.expenses.map(e => e.id)).toEqual(['saved']);
    fetchPage.mockResolvedValueOnce(page(['next']));
    await act(async () => list.loadMore());
    expect(fetchPage).toHaveBeenLastCalledWith(2);
    expect(list.expenses.map(e => e.id)).toEqual(['saved', 'next']);
  });

  it('ignores a late next page after refreshing or switching filters', async () => {
    fetchPage.mockResolvedValueOnce(page(['old'], 2));
    await act(async () => list.refresh());
    let finish;
    fetchPage.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    let pending;
    await act(async () => { pending = list.loadMore(); });
    fetchPage.mockResolvedValueOnce(page(['new']));
    await act(async () => list.refresh());
    await act(async () => { finish(page(['late'])); await pending; });
    expect(list.expenses.map(e => e.id)).toEqual(['new']);
  });

  it('does not show records from an old filter if the new filter is unavailable offline', async () => {
    fetchPage.mockResolvedValueOnce(page(['old-filter']));
    await act(async () => list.refresh());
    const newFilter = jest.fn().mockRejectedValue(new Error('Offline: no saved page'));
    await act(async () => renderer.update(<Probe fetcher={newFilter} />));
    await act(async () => {
      await expect(list.refresh()).rejects.toThrow('Offline');
    });
    expect(list.expenses).toEqual([]);
    expect(list.page).toBeNull();
  });
});
