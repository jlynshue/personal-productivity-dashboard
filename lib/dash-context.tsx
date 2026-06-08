"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { DashData, DASH } from "./data";

interface DashCtx {
  data: DashData;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  lastRefresh: Date | null;
  isLive: boolean;
}

const Ctx = createContext<DashCtx>({
  data: DASH,
  loading: false,
  error: null,
  refresh: () => {},
  lastRefresh: null,
  isLive: false,
});

export function DashProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DashData>(DASH);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [isLive, setIsLive] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error(`${res.status}`);
      const d = await res.json();
      setData(d);
      setError(null);
      setLastRefresh(new Date());
      setIsLive(d._live === true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <Ctx.Provider value={{ data, loading, error, refresh, lastRefresh, isLive }}>
      {children}
    </Ctx.Provider>
  );
}

export function useDash(): DashData {
  return useContext(Ctx).data;
}

export function useDashMeta() {
  const { loading, error, refresh, lastRefresh, isLive } = useContext(Ctx);
  return { loading, error, refresh, lastRefresh, isLive };
}
