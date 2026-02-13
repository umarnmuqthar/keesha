'use client';

import { ShellSearchProvider } from './ShellSearchContext';

export function AppStateProviders({ children }: { children: React.ReactNode }) {
  return <ShellSearchProvider>{children}</ShellSearchProvider>;
}
