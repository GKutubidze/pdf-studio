interface PageSelectorProps {
  totalPages: number;
  selectedPages: Set<number>;
  onToggle: (pageIndex: number) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  className?: string;
}

export function PageSelector({
  totalPages,
  selectedPages,
  onToggle,
  onSelectAll,
  onDeselectAll,
  className = '',
}: PageSelectorProps) {
  return (
    <div className={className}>
      <div className="mb-2 flex items-center gap-3 text-sm">
        <span className="text-gray-600 dark:text-gray-400">
          {selectedPages.size} of {totalPages} pages selected
        </span>
        <button
          onClick={onSelectAll}
          className="text-red-500 hover:underline"
        >
          Select all
        </button>
        <button
          onClick={onDeselectAll}
          className="text-gray-500 hover:underline"
        >
          Deselect all
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            onClick={() => onToggle(i)}
            className={`h-9 w-9 rounded-lg border text-sm font-medium transition ${
              selectedPages.has(i)
                ? 'border-red-500 bg-red-500 text-white'
                : 'border-gray-300 bg-white text-gray-700 hover:border-red-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
