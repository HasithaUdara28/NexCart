import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Truck, RotateCcw } from 'lucide-react';
import api from '../lib/axios';
import type { Product } from '../types';
import ProductCard from '../components/ui/ProductCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const PERKS = [
  {
    icon: <Truck size={28} className="text-blue-600" />,
    title: 'Free Delivery',
    desc: 'On all orders over £50. Fast and reliable shipping straight to your door.',
  },
  {
    icon: <RotateCcw size={28} className="text-blue-600" />,
    title: 'Easy Returns',
    desc: "30-day hassle-free returns. Not happy? We'll sort it out, no questions asked.",
  },
  {
    icon: <ShieldCheck size={28} className="text-blue-600" />,
    title: 'Secure Checkout',
    desc: 'Payments powered by Stripe. Your card details are never stored on our servers.',
  },
];

export default function HomePage() {
  const [products, setProducts]         = useState<Product[]>([]);
  const [categories, setCategories]     = useState<string[]>([]);
  const [loadingProds, setLoadingProds] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodsRes, catsRes] = await Promise.all([
          api.get<{ products: Product[] }>('/api/products?limit=8&sort=newest'),
          api.get<{ categories: string[] }>('/api/products/categories'),
        ]);
        setProducts(prodsRes.data.products);
        setCategories(catsRes.data.categories.slice(0, 6));
      } catch {
        // silently degrade — page still renders without products
      } finally {
        setLoadingProds(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen">

      {/* ── Hero ── */}
      <section className="relative bg-linear-to-br from-blue-600 via-blue-700 to-indigo-800 text-white overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        <div className="relative max-w-6xl mx-auto px-4 py-24 md:py-36 flex flex-col items-center text-center gap-6">
          <span className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-4 py-1.5 rounded-full">
            New arrivals every week
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight max-w-3xl">
            Shop the Latest
            <br />
            <span className="text-yellow-300">Trends</span>
          </h1>
          <p className="text-blue-100 text-lg max-w-xl">
            Discover thousands of products at unbeatable prices. From fashion to electronics —
            everything you need, delivered fast.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold px-7 py-3 rounded-xl hover:bg-blue-50 transition-colors shadow-lg"
            >
              Shop Now <ArrowRight size={17} />
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/30 text-white font-semibold px-7 py-3 rounded-xl hover:bg-white/20 transition-colors"
            >
              Join Free
            </Link>
          </div>
        </div>
      </section>

      {/* ── Categories ── */}
      {categories.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Shop by Category</h2>
            <Link
              to="/products"
              className="text-blue-600 text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all"
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="flex flex-wrap gap-3">
            {categories.map((cat) => (
              <Link
                key={cat}
                to={`/products?category=${encodeURIComponent(cat)}`}
                className="flex-1 min-w-30 max-w-50 flex items-center justify-center gap-2 bg-white border border-gray-200 rounded-xl px-5 py-4 text-sm font-semibold text-gray-700 hover:border-blue-500 hover:text-blue-600 hover:shadow-sm transition-all capitalize"
              >
                {cat}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Featured Products ── */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
          <Link
            to="/products"
            className="text-blue-600 text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all"
          >
            See all <ArrowRight size={14} />
          </Link>
        </div>

        {loadingProds ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-3">📦</p>
            <p className="text-lg font-medium">No products yet</p>
            <p className="text-sm">Check back soon — we're adding new items daily!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* ── Why Choose Us ── */}
      <section className="bg-gray-50 py-16 mt-4">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">
            Why Choose NexCart?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PERKS.map(({ icon, title, desc }) => (
              <div
                key={title}
                className="bg-white rounded-2xl border border-gray-200 p-7 flex flex-col items-center text-center gap-4 hover:shadow-md transition-shadow"
              >
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center">
                  {icon}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
