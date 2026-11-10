import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Product } from '../../types';
import { useStore } from '../../context/StoreContext';
import {
  Volume2,
  VolumeX,
  Heart,
  ChevronUp,
  ChevronDown,
  ShoppingBag,
  Sparkles,
  Flame,
  Clock,
  Share2,
  Star,
} from 'lucide-react';

interface Props {
  onOpenCustomizer: (product: Product) => void;
}

export const ReelsFeed: React.FC<Props> = ({ onOpenCustomizer }) => {
  const { products, activeRestaurant, activeTable, recordDwellTime } = useStore();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [likeCountMap, setLikeCountMap] = useState<Record<string, number>>(() => ({
    prod_pizza_gg: 142,
    prod_gnocchi_ragu: 89,
    prod_burrata_caprese: 64,
    prod_tiramisu: 53,
    prod_aperol_spritz: 38,
  }));
  const [activeDwellSeconds, setActiveDwellSeconds] = useState(0);

  // Filter products for active restaurant
  const restaurantProducts = products.filter(p => p.restaurantId === activeRestaurant.id);
  const feedItems = [...restaurantProducts].sort((a, b) => (b.isHighlight ? 1 : 0) - (a.isHighlight ? 1 : 0));

  const containerRef = useRef<HTMLDivElement>(null);
  const dwellTimerRef = useRef<any>(null);
  const startTimeRef = useRef<number>(Date.now());
  const currentProductRef = useRef<Product | null>(feedItems[0] || null);

  useEffect(() => {
    currentProductRef.current = feedItems[activeIndex] || null;
  }, [activeIndex, feedItems]);

  // Track dwell time
  useEffect(() => {
    const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
    if (elapsed > 0 && currentProductRef.current) {
      recordDwellTime(currentProductRef.current.id, elapsed, false);
    }

    startTimeRef.current = Date.now();
    setActiveDwellSeconds(0);

    const currentItem = feedItems[activeIndex];
    if (currentItem) {
      recordDwellTime(currentItem.id, 0, true);
    }

    clearInterval(dwellTimerRef.current);
    dwellTimerRef.current = setInterval(() => {
      const liveElapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
      setActiveDwellSeconds(liveElapsed);
    }, 1000);

    return () => {
      clearInterval(dwellTimerRef.current);
      const exitElapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
      if (exitElapsed > 0 && currentProductRef.current) {
        recordDwellTime(currentProductRef.current.id, exitElapsed, false);
      }
    };
  }, [activeIndex, recordDwellTime]);

  const scrollToSlide = useCallback((index: number) => {
    if (!containerRef.current) return;
    const target = containerRef.current.children[index] as HTMLElement;
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
      setActiveIndex(index);
    }
  }, []);

  const handleNext = () => {
    if (activeIndex < feedItems.length - 1) {
      scrollToSlide(activeIndex + 1);
    }
  };

  const handlePrev = () => {
    if (activeIndex > 0) {
      scrollToSlide(activeIndex - 1);
    }
  };

  const handleScroll = () => {
    if (!containerRef.current) return;
    const scrollPosition = containerRef.current.scrollTop;
    const itemHeight = containerRef.current.clientHeight;
    if (itemHeight === 0) return;
    const newIndex = Math.round(scrollPosition / itemHeight);
    if (newIndex !== activeIndex && newIndex >= 0 && newIndex < feedItems.length) {
      setActiveIndex(newIndex);
    }
  };

  const toggleLike = (productId: string) => {
    const isLiked = !likedMap[productId];
    setLikedMap(prev => ({ ...prev, [productId]: isLiked }));
    setLikeCountMap(prev => ({
      ...prev,
      [productId]: (prev[productId] || 0) + (isLiked ? 1 : -1),
    }));
  };

  if (feedItems.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-neutral-500">
        <Sparkles className="w-12 h-12 text-red-600 mb-2 opacity-50" />
        <p className="font-bold text-neutral-900">Nenhum prato cadastrado no Reels deste restaurante.</p>
        <p className="text-xs mt-1">Acesse o painel do lojista para adicionar fotos e vídeos.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full max-h-[640px] sm:max-w-md sm:mx-auto bg-black rounded-none sm:rounded-3xl overflow-hidden shadow-2xl border-0 sm:border sm:border-neutral-200">
      {/* Reel Feed Container with snap scrolling */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="w-full h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar"
        style={{ scrollSnapType: 'y mandatory' }}
      >
        {feedItems.map((product, index) => {
          const isActive = index === activeIndex;
          const isLiked = !!likedMap[product.id];
          const likes = likeCountMap[product.id] || 42;

          return (
            <div
              key={product.id}
              className="relative w-full h-full snap-start snap-always shrink-0 flex items-center justify-center bg-black overflow-hidden"
            >
              {/* Media: Looping Video or Image */}
              {product.mediaType === 'video' ? (
                <video
                  src={product.mediaUrl}
                  poster={product.videoPoster}
                  autoPlay
                  loop
                  muted={isMuted}
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <img
                  src={product.mediaUrl}
                  alt={product.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}

              {/* Gradient overlays for high text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/30 pointer-events-none" />

              {/* Top Bar inside Reel */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                  <span className="bg-white/95 backdrop-blur-md text-red-600 text-[11px] font-black px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm border border-neutral-200">
                    <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                    REELS DO CHEF
                  </span>
                  {activeTable && (
                    <span className="bg-white/95 backdrop-blur-md text-neutral-900 text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm border border-neutral-200">
                      {activeTable.label}
                    </span>
                  )}
                </div>

                {/* Dwell Time telemetry badge */}
                {isActive && (
                  <div
                    title="Tempo de visualização do cliente"
                    className="bg-white/95 backdrop-blur-md text-neutral-900 border border-neutral-200 text-[10px] font-mono font-black px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm"
                  >
                    <Clock className="w-3 h-3 text-red-600" />
                    <span>{activeDwellSeconds}s vendo</span>
                  </div>
                )}
              </div>

              {/* Right Side Social / Action Floating Column */}
              <div className="absolute right-3 bottom-24 flex flex-col items-center gap-3.5 z-20">
                {/* Sound Toggle */}
                {product.mediaType === 'video' && (
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    aria-label={isMuted ? 'Ativar som' : 'Desativar som'}
                    className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md border border-neutral-300 flex items-center justify-center text-neutral-900 hover:bg-white transition-transform active:scale-90 shadow-md"
                  >
                    {isMuted ? <VolumeX className="w-5 h-5 text-neutral-500" /> : <Volume2 className="w-5 h-5 text-green-600" />}
                  </button>
                )}

                {/* Like Button */}
                <button
                  onClick={() => toggleLike(product.id)}
                  aria-label={isLiked ? 'Descurtir prato' : 'Curtir prato'}
                  className="flex flex-col items-center gap-0.5 group"
                >
                  <div
                    className={`w-11 h-11 rounded-full backdrop-blur-md border flex items-center justify-center transition-all group-active:scale-125 shadow-md ${
                      isLiked
                        ? 'bg-red-600 border-red-600 text-white'
                        : 'bg-white/90 border-neutral-300 text-neutral-800 hover:bg-white'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${isLiked ? 'fill-white' : ''}`} />
                  </div>
                  <span className="text-[11px] font-black text-white drop-shadow">
                    {likes}
                  </span>
                </button>

                {/* Share Button */}
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: product.name,
                        text: `Olha esse ${product.name} na ${activeRestaurant.name}!`,
                        url: window.location.href,
                      }).catch(() => {});
                    }
                  }}
                  aria-label="Compartilhar prato"
                  className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md border border-neutral-300 flex items-center justify-center text-neutral-800 hover:bg-white transition-transform active:scale-90 shadow-md"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>

              {/* Bottom Reel Information & Order Button */}
              <div className="absolute bottom-3 left-3 right-16 z-20 space-y-2">
                {/* Category & Rating */}
                <div className="flex items-center gap-2">
                  <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shadow-sm">
                    {product.category}
                  </span>

                  {product.averageRating && (
                    <span className="bg-white/95 backdrop-blur-sm text-neutral-900 text-[10px] font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                      <Star className="w-3 h-3 fill-green-600 text-green-600" />
                      <span>{product.averageRating.toFixed(1)}</span>
                      {product.reviewsCount ? <span className="text-neutral-500">({product.reviewsCount})</span> : null}
                    </span>
                  )}

                  {product.preparationTimeMin && (
                    <span className="text-white text-[11px] font-bold flex items-center gap-1 drop-shadow">
                      <Flame className="w-3.5 h-3.5 text-red-400" />
                      ~{product.preparationTimeMin} min
                    </span>
                  )}
                </div>

                {/* Name & Price */}
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white leading-tight drop-shadow-md">
                    {product.name}
                  </h3>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-xl sm:text-2xl font-black text-white drop-shadow">
                      R$ {product.price.toFixed(2)}
                    </span>
                    {(product.flavorsConfig || product.customizationGroups) && (
                      <span className="text-xs text-neutral-200 drop-shadow">
                        (preço base)
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-neutral-100 line-clamp-2 drop-shadow leading-relaxed font-medium">
                  {product.description}
                </p>

                {/* Ingredients Pills */}
                {product.ingredients && product.ingredients.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {product.ingredients.slice(0, 3).map((ing, i) => (
                      <span
                        key={i}
                        className="text-[10px] bg-white/20 backdrop-blur-sm text-white font-semibold px-2 py-0.5 rounded-md"
                      >
                        {ing}
                      </span>
                    ))}
                  </div>
                )}

                {/* Main Order CTA Button (BOLD RED) */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => onOpenCustomizer(product)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-black text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xl shadow-red-600/30 active:scale-[0.98] transition-transform"
                  >
                    <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
                    <span>
                      {product.flavorsConfig || product.customizationGroups ? 'Personalizar Sabores & Pedir' : 'Pedir nesta Mesa'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Prev/Next desktop/assistive arrows */}
      <div className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 flex-col gap-2 z-30">
        <button
          onClick={handlePrev}
          disabled={activeIndex === 0}
          aria-label="Reel anterior"
          className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-md border border-neutral-300 flex items-center justify-center text-neutral-800 hover:bg-white disabled:opacity-30 transition-all shadow-md"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
        <button
          onClick={handleNext}
          disabled={activeIndex === feedItems.length - 1}
          aria-label="Próximo reel"
          className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-md border border-neutral-300 flex items-center justify-center text-neutral-800 hover:bg-white disabled:opacity-30 transition-all shadow-md"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Slide dots indicator */}
      <div className="absolute left-1/2 -translate-x-1/2 top-4 flex gap-1.5 z-20">
        {feedItems.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === activeIndex ? 'w-6 bg-red-600' : 'w-2 bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
