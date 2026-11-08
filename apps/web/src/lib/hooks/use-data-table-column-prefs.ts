"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_PREFIX = "itdms.datatable.";

export type ColumnPrefs = {
  hidden: string[];
  order: string[];
};

function loadPrefs(tableId: string): ColumnPrefs | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${tableId}`);
    if (!raw) return null;
    return JSON.parse(raw) as ColumnPrefs;
  } catch {
    return null;
  }
}

function savePrefs(tableId: string, prefs: ColumnPrefs) {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${tableId}`, JSON.stringify(prefs));
  } catch {
    /* quota / private mode */
  }
}

export function useDataTableColumnPrefs(tableId: string | undefined, columnKeys: string[]) {
  const [prefs, setPrefs] = useState<ColumnPrefs>(() => ({
    hidden: [],
    order: columnKeys,
  }));

  const columnKeySignature = columnKeys.join("|");

  useEffect(() => {
    if (!tableId) {
      setPrefs({ hidden: [], order: columnKeys });
      return;
    }
    const stored = loadPrefs(tableId);
    if (stored) {
      const order = [
        ...stored.order.filter((k) => columnKeys.includes(k)),
        ...columnKeys.filter((k) => !stored.order.includes(k)),
      ];
      setPrefs({ hidden: stored.hidden.filter((k) => columnKeys.includes(k)), order });
    } else {
      setPrefs({ hidden: [], order: columnKeys });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed by stable columnKeySignature
  }, [tableId, columnKeySignature]);

  const persist = useCallback(
    (next: ColumnPrefs) => {
      setPrefs(next);
      if (tableId) savePrefs(tableId, next);
    },
    [tableId],
  );

  const toggleColumn = useCallback(
    (key: string) => {
      const hidden = prefs.hidden.includes(key)
        ? prefs.hidden.filter((k) => k !== key)
        : [...prefs.hidden, key];
      persist({ ...prefs, hidden });
    },
    [persist, prefs],
  );

  const moveColumn = useCallback(
    (key: string, direction: "up" | "down") => {
      const order = [...prefs.order];
      const idx = order.indexOf(key);
      if (idx < 0) return;
      const swap = direction === "up" ? idx - 1 : idx + 1;
      if (swap < 0 || swap >= order.length) return;
      const a = order[idx]!;
      const b = order[swap]!;
      order[idx] = b;
      order[swap] = a;
      persist({ ...prefs, order });
    },
    [persist, prefs],
  );

  const visibleKeys = useMemo(
    () => prefs.order.filter((k) => !prefs.hidden.includes(k)),
    [prefs.hidden, prefs.order],
  );

  return { prefs, visibleKeys, toggleColumn, moveColumn, reset: () => persist({ hidden: [], order: columnKeys }) };
}
