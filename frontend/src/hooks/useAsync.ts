import { useCallback, useEffect, useState } from "react";

export type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

export function useAsync<T>(fn: () => Promise<T>, deps: any[] = []) {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const run = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fn();
      setState({ data, loading: false, error: null });
      return data;
    } catch (e: any) {
      const msg = e?.message ?? "Unknown error";
      setState({ data: null, loading: false, error: msg });
      throw e;
    }
  }, deps);

  useEffect(() => {
    void run();
  }, [run]);

  return { ...state, run };
}

