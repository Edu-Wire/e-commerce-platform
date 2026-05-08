interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  total?: number;
  limit?: number;
}

export default function Pagination({ page, totalPages, onPageChange, total, limit }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  const start = total && limit ? (page - 1) * limit + 1 : null;
  const end = total && limit ? Math.min(page * limit, total) : null;

  return (
    <div className="flex items-center justify-between px-1 py-3">
      {total !== undefined && start !== null && end !== null ? (
        <p className="text-sm text-gray-500">
          Showing <span className="font-medium">{start}</span>–<span className="font-medium">{end}</span> of{' '}
          <span className="font-medium">{total}</span>
        </p>
      ) : (
        <div />
      )}
      <div className="flex gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="px-2.5 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition-colors"
        >
          Prev
        </button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="px-2.5 py-1.5 text-sm text-gray-400">
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={`px-2.5 py-1.5 text-sm rounded-lg border transition-colors ${
                p === page
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="px-2.5 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}
