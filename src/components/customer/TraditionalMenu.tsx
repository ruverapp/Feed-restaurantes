import React, { useState, useMemo } from 'react';
import { Product } from '../../types';
import { useStore } from '../../context/StoreContext';
import { Search, Plus, Star, CheckCircle2 } from 'lucide-react';

interface Props {
  onOpenCustomizer: (product: Product) => void;
}

export const TraditionalMenu: React.FC<Props> = ({ onOpenCustomizer }) => {
  const { products, activeRestaurant, reviews } = useStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const restaurantProducts = useMemo(() => {
    return products.filter(p => p.restaurantId === activeRestaurant.id);
  }, [products, activeRestaurant.id]);

  const categories = useMemo(() => {
    const set = new Set(restaurantProducts.map(p => p.category));
    return ['all', ...Array.from(set)];
  }, [restaurantProducts]);

  const filteredProducts = useMemo(() => {
    return restaurantProducts.filter(product => {
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      const matchesSearch =
        searchQuery.trim() === '' ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [restaurantProducts, selectedCategory, searchQuery]);

  // Product rating lookup
  const getProductRating = (productId: string) => {
    const dishReviews = reviews.filter(r => r.productId === productId);
    if (dishReviews.length === 0) return { rating: 5.0, count: 0 };
    const sum = dishReviews.reduce((acc, r) => acc + r.rating, 0);
    return {
      rating: Number((sum / dishReviews.length).toFixed(1)),
      count: dishReviews.length,
    };
  };

  return (
    <div className="space-y-4 pb-28 max-w-2xl mx-auto px-3 sm:px-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="search"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Buscar no cardápio (ex: pizza, burger, chopp)..."
          className="w-full bg-white border border-neutral-300 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors shadow-xs"
        />
      </div>

      {/* Categories Horizontal Scroll */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {categories.map(cat => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`shrink-0 text-xs font-bold px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                isSelected
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-white border border-neutral-300 text-neutral-700 hover:border-neutral-400'
              }`}
            >
              {cat === 'all' ? '🍽️ Todos os Pratos' : cat}
            </button>
          );
        })}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {filteredProducts.map(product => {
          const stats = getProductRating(product.id);
          const hasCustomization = !!(product.customizationGroups?.length || product.flavorsConfig);

          return (
            <div
              key={product.id}
              className="bg-white border border-neutral-200 hover:border-neutral-300 rounded-2xl p-3 flex flex-col justify-between transition-all group shadow-xs hover:shadow-md"
            >
              <div className="flex gap-3">
                {/* Thumbnail */}
                <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-neutral-100 shrink-0 border border-neutral-200">
                  <img
                    src={product.videoPoster || product.mediaUrl}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {product.mediaType === 'video' && (
                    <span className="absolute top-1 left-1 bg-black/80 backdrop-blur-sm text-[9px] font-bold text-white px-1.5 py-0.2 rounded">
                      REELS
                    </span>
                  )}
                  {product.isHighlight && (
                    <span className="absolute bottom-1 right-1 bg-red-600 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded">
                      ★ TOP
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] text-red-600 font-bold uppercase tracking-wider">
                      {product.category}
                    </span>
                    <span className="flex items-center gap-0.5 text-xs font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded border border-green-200">
                      <Star className="w-3 h-3 fill-green-600 text-green-600" />
                      {stats.count > 0 ? stats.rating : (product.averageRating || 5.0)}
                    </span>
                  </div>

                  <h3 className="text-sm font-black text-neutral-900 truncate mt-0.5 group-hover:text-red-600 transition-colors">
                    {product.name}
                  </h3>

                  <p className="text-xs text-neutral-600 line-clamp-2 mt-1 leading-tight">
                    {product.description}
                  </p>

                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    {hasCustomization && (
                      <span className="text-[10px] bg-neutral-100 text-neutral-800 border border-neutral-300 px-1.5 py-0.2 rounded font-semibold">
                        Personalizável
                      </span>
                    )}
                    <span className="flex items-center gap-0.5 text-[10px] text-green-700 font-semibold">
                      <CheckCircle2 className="w-2.5 h-2.5 text-green-600" /> Em estoque
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom bar inside card */}
              <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase font-semibold block leading-none">Preço</span>
                  <span className="text-base font-black text-neutral-900">
                    R$ {product.price.toFixed(2)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenCustomizer(product)}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>{hasCustomization ? 'Personalizar' : 'Pedir'}</span>
                </button>
              </div>
            </div>
          );
        })}

        {filteredProducts.length === 0 && (
          <div className="col-span-full py-12 text-center text-neutral-500 bg-white border border-neutral-200 rounded-2xl">
            <p className="font-bold text-neutral-900">Nenhum prato encontrado.</p>
            <p className="text-xs mt-1">Tente pesquisar com outro termo ou selecione outra categoria.</p>
          </div>
        )}
      </div>
    </div>
  );
};
