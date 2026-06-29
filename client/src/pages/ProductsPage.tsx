import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, X } from 'lucide-react';
import api from '../lib/axios';
import type { Product } from '../types';
import ProductCard from '../components/ui/ProductCard';
import SkeletonCard from '../components/ui/SkeletonCard';
import Pagination from '../components/ui/Pagination';

interface ProductsResponse {
  products: Product[];
  total: number;
  pages: number;
  page: number;
}

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Derived filter values from URL (source of truth)
  const currentCategory = searchParams.get('category') ?? '';
  const currentSort     = searchParams.get('sort') ?? 'newest';
  const currentPage     = Number(searchParams.get('page') ?? '1');

  // Local input state (for responsive typing before committing to URL)
  const [searchInput,   setSearchInput]   = useState(() => searchParams.get('search')   ?? '');
  const [minPriceInput, setMinPriceInput] = useState(() => searchParams.get('minPrice') ?? '');
  const [maxPriceInput, setMaxPriceInput] = useState(() => searchParams.get('maxPrice') ?? '');

  // Products
  const [products,   setProducts]   = useState<Product[]>([]);
  const [total,      setTotal]      = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading,    setLoading]    = useState(true);

  // Categories
  const [categories, setCategories] = useState<string[]>([]);

  // Mobile filter panel
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Helper: update a single URL param and reset page (unless updating page itself)
  const setParam = useCallback(
    (key: string, value: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value) next.set(key, value);
          else next.delete(key);
          if (key !== 'page') next.delete('page');
          return next;
        },
        { replace: key === 'search' },
      );
    },
    [setSearchParams],
  );

  // Debounce search input → URL param (skip on first render to avoid double-fetch)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    const id = setTimeout(() => setParam('search', searchInput), 300);
    return () => clearTimeout(id);
  }, [searchInput, setParam]);

  // Fetch categories once
  useEffect(() => {
    api.get<{ categories: string[] }>('/api/products/categories')
      .then((res) => setCategories(res.data.categories))
      .catch(() => {});
  }, []);

  // Fetch products whenever URL params change
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams(searchParams);
    params.set('limit', '12');

    api.get<ProductsResponse>(`/api/products?${params.toString()}`)
      .then((res) => {
        setProducts(res.data.products);
        setTotal(res.data.total);
        setTotalPages(res.data.pages);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [searchParams]);

  const clearFilters = () => {
    setSearchInput('');
    setMinPriceInput('');
    setMaxPriceInput('');
    setSearchParams(new URLSearchParams());
  };

  const hasFilters = !!(
    searchParams.get('search') ||
    searchParams.get('category') ||
    searchParams.get('minPrice') ||
    searchParams.get('maxPrice') ||
    (searchParams.get('sort') && searchParams.get('sort') !== 'newest')
  );

  const handlePageChange = (page: number) => {
    setParam('page', String(page));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Sidebar (shared between desktop + mobile) ──────────────────────────────
  const sidebarContent = (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          Search
        </label>
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search products..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Category */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          Category
        </label>
        <div className="space-y-1.5">
          {['', ...categories].map((cat) => (
            <label
              key={cat || '__all__'}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <input
                type="radio"
                name="category"
                checked={currentCategory === cat}
                onChange={() => setParam('category', cat)}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600 group-hover:text-gray-900 capitalize transition-colors">
                {cat || 'All Categories'}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          Price Range
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min £"
            min="0"
            value={minPriceInput}
            onChange={(e) => setMinPriceInput(e.target.value)}
            onBlur={() => setParam('minPrice', minPriceInput)}
            onKeyDown={(e) => e.key === 'Enter' && setParam('minPrice', minPriceInput)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="number"
            placeholder="Max £"
            min="0"
            value={maxPriceInput}
            onChange={(e) => setMaxPriceInput(e.target.value)}
            onBlur={() => setParam('maxPrice', maxPriceInput)}
            onKeyDown={(e) => e.key === 'Enter' && setParam('maxPrice', maxPriceInput)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Sort */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          Sort By
        </label>
        <select
          value={currentSort}
          onChange={(e) => setParam('sort', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="newest">Newest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
      </div>

      {/* Clear Filters */}
      {hasFilters && (
        <button
          onClick={clearFilters}
          className="w-full flex items-center justify-center gap-1.5 py-2 text-sm font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
        >
          <X size={14} /> Clear All Filters
        </button>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* ── Mobile header + filter toggle ─────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5 md:hidden">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <button
          onClick={() => setShowMobileFilters((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Filter size={15} />
          Filters
          {hasFilters && <span className="w-2 h-2 rounded-full bg-blue-600 ml-0.5" />}
        </button>
      </div>

      {/* ── Mobile filters panel ──────────────────────────────────────────── */}
      {showMobileFilters && (
        <div className="md:hidden mb-6 bg-white border border-gray-200 rounded-xl p-5">
          {sidebarContent}
        </div>
      )}

      <div className="flex gap-7">

        {/* ── Desktop sidebar ───────────────────────────────────────────────── */}
        <aside className="hidden md:block w-60 shrink-0">
          <div className="bg-white border border-gray-200 rounded-xl p-5 sticky top-24">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-900">Filters</h2>
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>
            {sidebarContent}
          </div>
        </aside>

        {/* ── Main content area ─────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">

          {/* Desktop page heading + result count */}
          <div className="hidden md:flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Products</h1>
            {!loading && (
              <p className="text-sm text-gray-500">
                Showing{' '}
                <span className="font-semibold text-gray-700">{products.length}</span> of{' '}
                <span className="font-semibold text-gray-700">{total}</span> products
              </p>
            )}
          </div>

          {/* Mobile result count */}
          {!loading && (
            <p className="md:hidden text-sm text-gray-500 mb-4">
              Showing <span className="font-semibold text-gray-700">{products.length}</span> of{' '}
              <span className="font-semibold text-gray-700">{total}</span> products
            </p>
          )}

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <span className="text-7xl mb-5">🔍</span>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-500 mb-6 max-w-xs">
                Try adjusting your search or filters to find what you are looking for.
              </p>
              <button
                onClick={clearFilters}
                className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                {products.map((p) => (
                  <ProductCard key={p._id} product={p} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-10">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
