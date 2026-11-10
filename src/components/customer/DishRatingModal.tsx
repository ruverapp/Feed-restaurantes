import React, { useState } from 'react';
import { Product, Table } from '../../types';
import { Star, X, Check, Heart, MessageSquare } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  product: { id: string; name: string };
  table?: Table;
  onClose: () => void;
  onSubmitReview: (data: {
    productId: string;
    productName: string;
    rating: number;
    comment: string;
    customerName?: string;
    dishHighlights?: string[];
  }) => void;
}

const COMMON_HIGHLIGHTS = [
  'Massa no ponto',
  'Ingredientes frescos',
  'Porção generosa',
  'Super quente',
  'Molho maravilhoso',
  'Excelente custo-benefício',
];

export const DishRatingModal: React.FC<Props> = ({
  product,
  table,
  onClose,
  onSubmitReview,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [selectedHighlights, setSelectedHighlights] = useState<string[]>([]);

  const toggleHighlight = (tag: string) => {
    setSelectedHighlights(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() && rating === 0) return;

    onSubmitReview({
      productId: product.id,
      productName: product.name,
      rating,
      comment: comment.trim() || 'Prato excelente!',
      customerName: customerName.trim() || (table ? `Cliente ${table.label}` : 'Cliente da Mesa'),
      dishHighlights: selectedHighlights.length > 0 ? selectedHighlights : undefined,
    });

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
    });

    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
    >
      <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-neutral-200 text-neutral-900">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
              Sua Opinião Importa
            </span>
            <h3 className="text-lg font-black text-neutral-900 mt-2">
              Avaliar {product.name}
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Ajude o restaurante e futuros clientes compartilhando sua experiência
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Star selector */}
          <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 text-center space-y-2">
            <span className="font-bold text-neutral-700 block">Sua nota para este prato:</span>
            <div className="flex justify-center items-center gap-2">
              {[1, 2, 3, 4, 5].map(star => {
                const isFilled = (hoverRating !== null ? hoverRating : rating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    onClick={() => setRating(star)}
                    aria-label={`${star} estrelas`}
                    className="p-1 transition-transform hover:scale-125 focus:outline-none"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        isFilled
                          ? 'fill-amber-400 text-amber-500 drop-shadow-sm'
                          : 'text-neutral-300'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            <span className="text-xs font-black text-neutral-800">
              {rating === 5 && '⭐️⭐️⭐️⭐️⭐️ Espetacular!'}
              {rating === 4 && '⭐️⭐️⭐️⭐️ Muito bom!'}
              {rating === 3 && '⭐️⭐️⭐️ Bom, atendeu.'}
              {rating === 2 && '⭐️⭐️ Regular, pode melhorar.'}
              {rating === 1 && '⭐️ Não gostei.'}
            </span>
          </div>

          {/* Quick Highlights */}
          <div className="space-y-1.5">
            <label className="font-bold text-neutral-700">Destaques do prato (opcional):</label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_HIGHLIGHTS.map(tag => {
                const isSelected = selectedHighlights.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleHighlight(tag)}
                    className={`text-[11px] font-bold px-3 py-1.5 rounded-full border transition-all ${
                      isSelected
                        ? 'bg-green-600 text-white border-green-600 shadow-sm'
                        : 'bg-white text-neutral-700 border-neutral-300 hover:border-neutral-400'
                    }`}
                  >
                    {isSelected && '✓ '}
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Written Review */}
          <div className="space-y-1">
            <label className="font-bold text-neutral-700">Seu comentário ou sugestão:</label>
            <textarea
              rows={3}
              required
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="O que achou do sabor, apresentação, textura ou ponto? Deixe sua mensagem para o chef..."
              className="w-full bg-white border border-neutral-300 rounded-xl p-3 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-red-600 transition-colors"
            />
          </div>

          {/* Customer Name */}
          <div className="space-y-1">
            <label className="font-bold text-neutral-700">Seu Nome (opcional):</label>
            <input
              type="text"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              placeholder="Ex: Carlos M. ou deixar anônimo"
              className="w-full bg-white border border-neutral-300 rounded-xl p-2.5 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-red-600 transition-colors"
            />
          </div>

          <div className="flex gap-2 pt-2 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold py-3 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-extrabold py-3 rounded-xl transition-colors shadow-lg shadow-red-600/20 active:scale-95"
            >
              Enviar Avaliação
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
