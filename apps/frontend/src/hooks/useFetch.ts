'use client';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DependencyList,
  type Dispatch,
  type SetStateAction,
} from 'react';

export interface UseFetchResult<T> {
  data: T;
  loading: boolean;
  error: boolean;
  refetch: () => void;
  setData: Dispatch<SetStateAction<T>>;
}

/**
 * Shared data-fetch-on-mount hook.
 *
 * The fetch runs in an effect, but every state update happens *after* the
 * awaited request resolves — there is no synchronous setState in the effect
 * body, which is what `react-hooks/set-state-in-effect` guards against.
 *
 * Behaviour is stale-while-revalidate: `loading` is true only until the first
 * response. Dependency changes and `refetch()` re-run the request and swap the
 * data in place without flashing the loading state, which is what we want for
 * filter changes and realtime updates.
 *
 * @param fetcher   Returns the resolved data. Re-read on every run via a ref,
 *                  so the latest closure (capturing current props/state) is used.
 * @param deps      Re-fetch whenever any of these change.
 * @param initialData Value for `data` before the first response resolves.
 * @param onError   Optional callback for failures (e.g. a toast).
 */
export function useFetch<T>(
  fetcher: () => Promise<T>,
  deps: DependencyList,
  initialData: T,
  onError?: (error: unknown) => void,
): UseFetchResult<T> {
  const [data, setData] = useState<T>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);

  const fetcherRef = useRef(fetcher);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    fetcherRef.current = fetcher;
    onErrorRef.current = onError;
  });

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const result = await fetcherRef.current();
        if (!active) return;
        setData(result);
        setError(false);
      } catch (err) {
        if (!active) return;
        setError(true);
        onErrorRef.current?.(err);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadTick]);

  const refetch = useCallback(() => setReloadTick((t) => t + 1), []);

  return { data, loading, error, refetch, setData };
}
