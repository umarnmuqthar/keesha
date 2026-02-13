'use client';

import { useShellSearch } from './ShellSearchContext';

type ShellSearchProps = {
  formClassName: string;
  inputClassName: string;
};

export function ShellSearch({ formClassName, inputClassName }: ShellSearchProps) {
  const { query, setQuery } = useShellSearch();

  return (
    <div className={formClassName} role="search">
      <input
        type="search"
        className={inputClassName}
        placeholder="Search"
        aria-label="Search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
    </div>
  );
}
