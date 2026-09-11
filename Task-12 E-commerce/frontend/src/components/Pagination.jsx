import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Reusable Pagination component
 *
 * @param {Object} props
 * @param {number} props.currentPage - Active page number (1-indexed)
 * @param {number} props.totalPages - Total number of pages
 * @param {Function} props.onPageChange - Callback invoked when a page button is clicked
 */
export default function Pagination({ currentPage = 1, totalPages = 1, onPageChange }) {
  // Ensure valid values
  const current = Math.max(1, currentPage);
  const total = Math.max(1, totalPages);

  // Generate page numbers to display with smart ellipsis
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5; // maximum numbered buttons to show in window

    if (total <= maxVisible + 2) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      // Always show page 1
      pages.push(1);

      let start = Math.max(2, current - 1);
      let end = Math.min(total - 1, current + 1);

      if (current <= 3) {
        start = 2;
        end = 4;
      } else if (current >= total - 2) {
        start = total - 3;
        end = total - 1;
      }

      if (start > 2) {
        pages.push('dots-prev');
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < total - 1) {
        pages.push('dots-next');
      }

      // Always show last page
      pages.push(total);
    }

    return pages;
  };

  const handlePageClick = (page) => {
    if (page >= 1 && page <= total && page !== current) {
      onPageChange(page);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200">
      {/* Page X of Y text */}
      <p className="text-xs sm:text-sm text-slate-500 font-medium">
        Page <span className="font-bold text-slate-900">{current}</span> of{' '}
        <span className="font-bold text-slate-900">{total}</span>
      </p>

      {/* Pagination Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Previous Button */}
        <button
          type="button"
          disabled={current <= 1}
          onClick={() => handlePageClick(current - 1)}
          className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border ${
            current <= 1
              ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300 active:scale-95 shadow-sm'
          }`}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
          <span className="hidden sm:inline">Previous</span>
        </button>

        {/* Numbered Page Buttons */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((item, index) => {
            if (typeof item === 'string') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-2 py-1 text-slate-400 text-xs font-bold select-none"
                >
                  …
                </span>
              );
            }

            const isActive = item === current;
            return (
              <button
                key={item}
                type="button"
                onClick={() => handlePageClick(item)}
                aria-current={isActive ? 'page' : undefined}
                className={`min-w-[36px] h-9 px-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 scale-105'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 active:scale-95'
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          type="button"
          disabled={current >= total}
          onClick={() => handlePageClick(current + 1)}
          className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border ${
            current >= total
              ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300 active:scale-95 shadow-sm'
          }`}
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
