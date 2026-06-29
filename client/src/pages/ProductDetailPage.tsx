import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, Minus, Plus, ShoppingCart, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/axios';
import type { Product } from '../types';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import StarRating from '../components/ui/StarRating';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ProductCard from '../components/ui/ProductCard';

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  const [product,  setProduct]  = useState<Product | null>(null);
  const [related,  setRelated]  = useState<Product[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  const [mainImageIdx,   setMainImageIdx]   = useState(0);
  const [qty,            setQty]            = useState(1);
  const [addingToCart,   setAddingToCart]   = useState(false);

  const [reviewRating,      setReviewRating]      = useState(0);
  const [reviewHover,       setReviewHover]        = useState(0);
  const [reviewComment,     setReviewComment]      = useState('');
  const [submittingReview,  setSubmittingReview]   = useState(false);

  // Fetch product
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError('');
    api.get(`/api/products/${id}`)
      .then((res) => {
        const prod: Product = res.data.product ?? res.data;
        setProduct(prod);
        setMainImageIdx(0);
        setQty(1);
      })
      .catch(() => setError('Product not found'))
      .finally(() => setLoading(false));
  }, [id]);

  // Fetch related products
  const productCategory = product?.category;
  const productId       = product?._id;
  useEffect(() => {
    if (!productCategory || !productId) return;
    api.get<{ products: Product[] }>(
      `/api/products?category=${encodeURIComponent(productCategory)}&limit=5`,
    )
      .then((res) =>
        setRelated(res.data.products.filter((p) => p._id !== productId).slice(0, 4)),
      )
      .catch(() => {});
  }, [productCategory, productId]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    setAddingToCart(true);
    try {
      await addToCart(product!._id, qty);
      toast.success(`${product!.name} added to cart`);
    } catch {
      toast.error('Could not add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reviewRating === 0) { toast.error('Please select a rating'); return; }
    setSubmittingReview(true);
    try {
      await api.post(`/api/products/${id}/reviews`, {
        rating: reviewRating,
        comment: reviewComment,
      });
      toast.success('Review submitted!');
      setReviewRating(0);
      setReviewHover(0);
      setReviewComment('');
      const res = await api.get(`/api/products/${id}`);
      setProduct(res.data.product ?? res.data);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to submit review';
      toast.error(msg);
    } finally {
      setSubmittingReview(false);
    }
  };

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-48 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="aspect-square bg-gray-200 rounded-2xl" />
          <div className="space-y-4">
            <div className="h-5 bg-gray-200 rounded w-24" />
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-32" />
            <div className="h-10 bg-gray-200 rounded w-28" />
            <div className="h-4 bg-gray-200 rounded w-20" />
            <div className="space-y-2 pt-2">
              <div className="h-3 bg-gray-200 rounded" />
              <div className="h-3 bg-gray-200 rounded" />
              <div className="h-3 bg-gray-200 rounded w-2/3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center px-4">
        <span className="text-7xl mb-5">😕</span>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Product not found</h2>
        <p className="text-gray-500 mb-6">
          The product you are looking for does not exist or has been removed.
        </p>
        <Link
          to="/products"
          className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
        >
          Back to Products
        </Link>
      </div>
    );
  }

  const mainImage = product.images?.[mainImageIdx];
  const inStock   = product.stock > 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">

      {/* ── Breadcrumb ──────────────────────────────────────────────────────── */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-7 flex-wrap">
        <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
        <ChevronRight size={13} />
        <Link to="/products" className="hover:text-blue-600 transition-colors">Products</Link>
        <ChevronRight size={13} />
        <span className="text-gray-900 font-medium truncate max-w-xs">{product.name}</span>
      </nav>

      {/* ── Main: gallery + info ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-14">

        {/* Image Gallery */}
        <div className="space-y-3">
          <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden border border-gray-200">
            {mainImage ? (
              <img
                src={mainImage}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-8xl">📦</span>
              </div>
            )}
          </div>

          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setMainImageIdx(i)}
                  className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                    i === mainImageIdx
                      ? 'border-blue-500'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <img
                    src={img}
                    alt={`${product.name} view ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-4">
          <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full capitalize">
            {product.category}
          </span>

          <h1 className="text-3xl font-bold text-gray-900 leading-tight">{product.name}</h1>

          <div className="flex items-center gap-2">
            <StarRating rating={product.ratings} />
            <span className="text-sm text-gray-500">
              ({product.reviews.length} {product.reviews.length === 1 ? 'review' : 'reviews'})
            </span>
          </div>

          <p className="text-4xl font-extrabold text-gray-900">
            £{Number(product.price).toFixed(2)}
          </p>

          <p className={`text-sm font-semibold ${inStock ? 'text-green-600' : 'text-red-500'}`}>
            {inStock ? `In Stock (${product.stock} remaining)` : 'Out of Stock'}
          </p>

          <p className="text-gray-600 leading-relaxed text-sm">{product.description}</p>

          {/* Quantity selector */}
          {inStock && (
            <div className="flex items-center gap-3 pt-1">
              <span className="text-sm font-medium text-gray-700">Qty:</span>
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={qty <= 1}
                  className="p-2.5 text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition-colors"
                >
                  <Minus size={14} />
                </button>
                <span className="px-4 py-2 text-sm font-semibold border-x border-gray-300 min-w-12 text-center">
                  {qty}
                </span>
                <button
                  onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                  disabled={qty >= product.stock}
                  className="p-2.5 text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Add to Cart */}
          <button
            onClick={handleAddToCart}
            disabled={addingToCart || !inStock}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {addingToCart ? <LoadingSpinner size="sm" /> : <ShoppingCart size={18} />}
            {inStock ? 'Add to Cart' : 'Out of Stock'}
          </button>
        </div>
      </div>

      {/* ── Reviews Section ─────────────────────────────────────────────────── */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h2>

        {/* Average rating summary */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 flex items-center gap-6 mb-7">
          <div className="text-center">
            <p className="text-5xl font-extrabold text-gray-900">
              {product.ratings.toFixed(1)}
            </p>
            <StarRating rating={product.ratings} />
            <p className="text-xs text-gray-500 mt-1">
              {product.reviews.length} {product.reviews.length === 1 ? 'review' : 'reviews'}
            </p>
          </div>
        </div>

        {/* Add Review Form (authenticated users only) */}
        {isAuthenticated && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-7">
            <h3 className="font-bold text-gray-900 mb-4">Write a Review</h3>
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              {/* Star selector */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Your rating</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      onMouseEnter={() => setReviewHover(star)}
                      onMouseLeave={() => setReviewHover(0)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        size={28}
                        className={
                          star <= (reviewHover || reviewRating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'fill-gray-200 text-gray-200'
                        }
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Your review
                </label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={3}
                  placeholder="Share your experience with this product..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submittingReview}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {submittingReview && <LoadingSpinner size="sm" />}
                Submit Review
              </button>
            </form>
          </div>
        )}

        {/* Reviews list */}
        {product.reviews.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-3xl mb-3">💬</p>
            <p className="font-medium">No reviews yet</p>
            <p className="text-sm mt-1">Be the first to review this product!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {product.reviews.map((review, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{review.name}</p>
                    <StarRating rating={review.rating} />
                  </div>
                  <time className="text-xs text-gray-400 shrink-0">
                    {formatDate(review.createdAt)}
                  </time>
                </div>
                {review.comment && (
                  <p className="text-sm text-gray-600 leading-relaxed mt-2">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Related Products ────────────────────────────────────────────────── */}
      {related.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Products</h2>
          <div className="flex gap-4 overflow-x-auto pb-3 -mx-1 px-1">
            {related.map((p) => (
              <div key={p._id} className="w-56 shrink-0">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
