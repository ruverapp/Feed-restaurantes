import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Product } from '../../types';
import { useStore } from '../../context/StoreContext';
import {
  Volume2,
  VolumeX,
  Heart,
  ShoppingBag,
  Sparkles,
  Share2,
  Star,
  ChevronDown,
  ChevronUp,
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

  // Track dwell time silently for merchant analytics (hidden from customer view)
  useEffect(() => {
    const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
    if (elapsed > 0 && currentProductRef.current) {
      recordDwellTime(currentProductRef.current.id, elapsed, false);
    }

    startTimeRef.current = Date.now();

    const currentItem = feedItems[activeIndex];
    if (currentItem) {
      recordDwellTime(currentItem.id, 0, true);
    }

    clearInterval(dwellTimerRef.current);
    dwellTimerRef.current = setInterval(() => {
      // Dwell time accumulator runs silently in background
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
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-neutral-500 h-full">
        <Sparkles className="w-12 h-12 text-red-600 mb-2 opacity-50" />
        <p className="font-bold text-neutral-900">Nenhum prato cadastrado no Reels deste restaurante.</p>
        <p className="text-xs mt-1">Acesse o painel do lojista para adicionar fotos e vídeos.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full max-w-md mx-auto bg-black overflow-hidden flex flex-col justify-center sm:rounded-3xl sm:border sm:border-neutral-200 shadow-2xl">
      {/* Reel Feed Container with snap scrolling (100% responsive height) */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="w-full h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar select-none"
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
              {/* Media: Looping Video or High-res Image */}
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

              {/* Gradient overlays for high text readability & Instagram Reel aesthetics */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-black/35 pointer-events-none" />

              {/* Minimalist Top Indicator */}
              <div className="absolute top-3.5 left-4 right-4 flex items-center justify-between z-10 pointer-events-none">
                <div className="flex items-center gap-2">
                  {activeTable && (
                    <span className="bg-black/60 backdrop-blur-md text-white text-xs font-black px-3 py-1 rounded-full border border-white/20 shadow-sm pointer-events-auto">
                      {activeTable.label}
                    </span>
                  )}
                </div>
              </div>

              {/* Right Side Social Floating Buttons */}
              <div className="absolute right-3.5 bottom-24 flex flex-col items-center gap-4 z-20">
                {/* Sound Toggle */}
                {product.mediaType === 'video' && (
                  <button
                    type="button"
                    onClick={() => setIsMuted(!isMuted)}
                    aria-label={isMuted ? 'Ativar som' : 'Desativar som'}
                    className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-black/80 transition-transform active:scale-90 shadow-md cursor-pointer"
                  >
                    {isMuted ? <VolumeX className="w-5 h-5 text-neutral-400" /> : <Volume2 className="w-5 h-5 text-green-400" />}
                  </button>
                )}

                {/* Like Button */}
                <button
                  type="button"
                  onClick={() => toggleLike(product.id)}
                  aria-label={isLiked ? 'Descurtir prato' : 'Curtir prato'}
                  className="flex flex-col items-center gap-0.5 group cursor-pointer"
                >
                  <div
                    className={`w-11 h-11 rounded-full backdrop-blur-md border flex items-center justify-center transition-all group-active:scale-125 shadow-md ${
                      isLiked
                        ? 'bg-red-600 border-red-600 text-white'
                        : 'bg-black/60 border-white/20 text-white hover:bg-black/80'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${isLiked ? 'fill-white text-white' : ''}`} />
                  </div>
                  <span className="text-[11px] font-black text-white drop-shadow">
                    {likes}
                  </span>
                </button>

                {/* Share Button */}
                <button
                  type="button"
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
                  className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-black/80 transition-transform active:scale-90 shadow-md cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>

              {/* Bottom Reel Product Information & Order CTA */}
              <div className="absolute bottom-4 left-4 right-16 z-20 space-y-2.5">
                {/* Category & Rating */}
                <div className="flex items-center gap-2">
                  <span className="bg-red-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded uppercase tracking-wider shadow-sm">
                    {product.category}
                  </span>

                  {product.averageRating && (
                    <span className="bg-black/60 backdrop-blur-md text-white text-[11px] font-black px-2 py-0.5 rounded flex items-center gap-1 border border-white/20">
                      <Star className="w-3.5 h-3.5 fill-green-500 text-green-500" />
                      <span>{product.averageRating.toFixed(1)}</span>
                      {product.reviewsCount ? <span className="text-white/70">({product.reviewsCount})</span> : null}
                    </span>
                  )}
                </div>

                {/* Title & Description */}
                <div>
                  <h2 className="text-xl font-black text-white leading-tight drop-shadow-md">
                    {product.name}
                  </h2>
                  <p className="text-xs text-white/90 line-clamp-2 mt-1 drop-shadow-sm font-medium">
                    {product.description}
                  </p>
                </div>

                {/* Price & Fast Order Button */}
                <div className="pt-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenCustomizer(product)}
                    className="bg-red-600 hover:bg-red-700 active:scale-98 text-white font-black text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg transition-all cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Quero Este • R$ {product.price.toFixed(2)}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Up / Down Navigation Arrows for Desktop convenience */}
      <div className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 flex-col gap-2 z-30 pointer-events-none">
        <button
          type="button"
          onClick={handlePrev}
          disabled={activeIndex === 0}
          aria-label="Item anterior"
          className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 text-white flex items-center justify-center hover:bg-black/90 disabled:opacity-30 pointer-events-auto transition-all cursor-pointer"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={activeIndex === feedItems.length - 1}
          aria-label="Próximo item"
          className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 text-white flex items-center justify-center hover:bg-black/90 disabled:opacity-30 pointer-events-auto transition-all cursor-pointer"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
