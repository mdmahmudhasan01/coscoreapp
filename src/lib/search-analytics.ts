// Lightweight client-side search analytics.
// Persists to localStorage — visible in the /search-analytics dashboard.

const KEY = "lookzene:search-analytics:v1";
const MAX_EVENTS = 2000;

export type SearchEvent =
  | { type: "query"; q: string; results: number; ts: number }
  | { type: "filter"; facet: string; value: string; ts: number }
  | { type: "sort"; value: string; ts: number };

type State = { events: SearchEvent[] };

const empty: State = { events: [] };

function read(): State {
  if (typeof window === "undefined") return empty;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as State;
    if (!parsed || !Array.isArray(parsed.events)) return empty;
    return parsed;
  } catch {
    return empty;
  }
}

function write(state: State) {
  if (typeof window === "undefined") return;
  try {
    const trimmed: State = {
      events: state.events.slice(-MAX_EVENTS),
    };
    localStorage.setItem(KEY, JSON.stringify(trimmed));
  } catch {
    /* ignore quota */
  }
}

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

export const searchAnalytics = {
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  getSnapshot(): State {
    return read();
  },
  recordQuery(q: string, results: number) {
    const value = q.trim().toLowerCase();
    if (!value) return;
    const s = read();
    // Debounce: if the last query event is the same term within 1.5s, skip.
    const last = [...s.events].reverse().find((e) => e.type === "query") as
      | Extract<SearchEvent, { type: "query" }>
      | undefined;
    const now = Date.now();
    if (last && last.q === value && now - last.ts < 1500) return;
    s.events.push({ type: "query", q: value, results, ts: now });
    write(s);
    notify();
  },
  recordFilter(facet: string, value: string) {
    const v = value.trim();
    if (!v) return;
    const s = read();
    s.events.push({ type: "filter", facet, value: v, ts: Date.now() });
    write(s);
    notify();
  },
  recordSort(value: string) {
    if (!value || value === "relevance") return;
    const s = read();
    s.events.push({ type: "sort", value, ts: Date.now() });
    write(s);
    notify();
  },
  clear() {
    write(empty);
    notify();
  },
};

export type AnalyticsStats = {
  totalSearches: number;
  uniqueQueries: number;
  zeroResultRate: number;
  topQueries: { q: string; count: number; lastResults: number }[];
  zeroResultQueries: { q: string; count: number }[];
  topFilters: { facet: string; value: string; count: number }[];
  topSorts: { value: string; count: number }[];
};

export function computeStats(events: SearchEvent[]): AnalyticsStats {
  const queries = events.filter((e): e is Extract<SearchEvent, { type: "query" }> => e.type === "query");
  const filters = events.filter((e): e is Extract<SearchEvent, { type: "filter" }> => e.type === "filter");
  const sorts = events.filter((e): e is Extract<SearchEvent, { type: "sort" }> => e.type === "sort");

  const qMap = new Map<string, { count: number; lastResults: number; lastTs: number }>();
  for (const e of queries) {
    const cur = qMap.get(e.q);
    if (!cur || e.ts > cur.lastTs) {
      qMap.set(e.q, {
        count: (cur?.count ?? 0) + 1,
        lastResults: e.results,
        lastTs: e.ts,
      });
    } else {
      cur.count += 1;
    }
  }
  const topQueries = [...qMap.entries()]
    .map(([q, v]) => ({ q, count: v.count, lastResults: v.lastResults }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  const zeroMap = new Map<string, number>();
  for (const e of queries) {
    if (e.results === 0) zeroMap.set(e.q, (zeroMap.get(e.q) ?? 0) + 1);
  }
  const zeroResultQueries = [...zeroMap.entries()]
    .map(([q, count]) => ({ q, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  const zeroCount = queries.filter((e) => e.results === 0).length;

  const fMap = new Map<string, { facet: string; value: string; count: number }>();
  for (const e of filters) {
    const key = `${e.facet}::${e.value}`;
    const cur = fMap.get(key);
    if (cur) cur.count += 1;
    else fMap.set(key, { facet: e.facet, value: e.value, count: 1 });
  }
  const topFilters = [...fMap.values()].sort((a, b) => b.count - a.count).slice(0, 20);

  const sMap = new Map<string, number>();
  for (const e of sorts) sMap.set(e.value, (sMap.get(e.value) ?? 0) + 1);
  const topSorts = [...sMap.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalSearches: queries.length,
    uniqueQueries: qMap.size,
    zeroResultRate: queries.length ? zeroCount / queries.length : 0,
    topQueries,
    zeroResultQueries,
    topFilters,
    topSorts,
  };
}
