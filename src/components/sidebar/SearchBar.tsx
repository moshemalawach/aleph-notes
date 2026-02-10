import { useUIStore } from '../../stores/ui';

export default function SearchBar() {
  const { searchQuery, setSearchQuery } = useUIStore();

  return (
    <div className="px-3 pt-3 pb-2">
      <div className="relative group">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-ghost group-focus-within:text-accent transition-colors duration-200"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-[13px] rounded-lg bg-hover border border-edge focus:border-accent-edge focus:bg-elevated focus:outline-none transition-all duration-200 placeholder:text-ink-ghost font-body"
        />
      </div>
    </div>
  );
}
