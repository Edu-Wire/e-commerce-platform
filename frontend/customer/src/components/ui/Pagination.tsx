interface PaginationProps {
  page: number;
  total_pages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, total_pages, onPageChange }: PaginationProps) {
  if (total_pages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | '...')[] = [];
    if (total_pages <= 7) {
      for (let i = 1; i <= total_pages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      for (let i = Math.max(2, page - 1); i <= Math.min(total_pages - 1, page + 1); i++) {
        pages.push(i);
      }
      if (page < total_pages - 2) pages.push('...');
      pages.push(total_pages);
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-1 mt-8">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        &larr; Prev
      </button>

      {getPageNumbers().map((p, idx) =>
        p === '...' ? (
          <span key={`dots-${idx}`} className="px-3 py-2 text-gray-500">...</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p as number)}
            className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
              p === page
                ? 'bg-primary-600 text-white border-primary-600'
                : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === total_pages}
        className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Next &rarr;
      </button>
    </div>
  );
}
