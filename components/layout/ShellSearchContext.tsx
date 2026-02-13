'use client';

import { createContext, useContext, useMemo, useState } from 'react';

type ShellSearchContextValue = {
  query: string;
  setQuery: (value: string) => void;
};

const ShellSearchContext = createContext<ShellSearchContextValue | null>(null);

export function ShellSearchProvider({ children }: { children: React.ReactNode }) {
  const [query, setQuery] = useState('');
  const value = useMemo(() => ({ query, setQuery }), [query]);

  return <ShellSearchContext.Provider value={value}>{children}</ShellSearchContext.Provider>;
}

export function useShellSearch() {
  const context = useContext(ShellSearchContext);
  if (!context) {
    throw new Error('useShellSearch must be used inside ShellSearchProvider');
  }
  return context;
}
