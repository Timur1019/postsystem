import { useState } from 'react';
import { PRODUCT_DEFAULT_FILTERS } from '../../constants';

export function useProductsPageFilters({ setPage, setAppliedFilters }) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState(PRODUCT_DEFAULT_FILTERS);

  const applyFilters = () => {
    setAppliedFilters({ ...filters });
    setPage(0);
    setFiltersOpen(false);
  };

  const resetFilters = () => {
    const f = { ...PRODUCT_DEFAULT_FILTERS };
    setFilters(f);
    setAppliedFilters(f);
    setPage(0);
  };

  return {
    filtersOpen,
    setFiltersOpen,
    filters,
    setFilters,
    applyFilters,
    resetFilters,
  };
}
