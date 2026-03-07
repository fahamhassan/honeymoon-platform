import { useState, useEffect, useCallback } from 'react';

/**
 * useQuery — fetch data from the API with loading, error, and refresh support.
 *
 * Usage:
 *   const { data, loading, error, refresh } = useQuery(() => api.vendors.list({ category: 'venues' }));
 */
export function useQuery(fetcher, deps = [], options = {}) {
  const { initialData = null, skip = false } = options;
  const [data, setData]       = useState(initialData);
  const [loading, setLoading] = useState(!skip);
  const [error, setError]     = useState(null);

  const fetch_ = useCallback(async () => {
    if (skip) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
    } catch (err) {
      setError(err?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { fetch_(); }, [fetch_]);

  return { data, loading, error, refresh: fetch_ };
}

/**
 * useMutation — fire an API call on demand (POST/PUT/PATCH/DELETE).
 *
 * Usage:
 *   const { mutate, loading, error } = useMutation(api.bookings.create);
 *   await mutate({ vendor_id, service_id, ... });
 */
export function useMutation(mutator, options = {}) {
  const { onSuccess, onError } = options;
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [data, setData]       = useState(null);

  const mutate = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await mutator(...args);
      setData(result);
      onSuccess?.(result);
      return result;
    } catch (err) {
      const msg = err?.message || 'Something went wrong';
      setError(msg);
      onError?.(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [mutator]);

  return { mutate, loading, error, data };
}
