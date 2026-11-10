import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product, CartItem } from '../../types';
import { ReelsFeed } from './ReelsFeed';
import { TraditionalMenu } from './TraditionalMenu';
import { TableBillTab } from './TableBillTab';
import { ItemCustomizerModal } from './ItemCustomizerModal';
import { DishRatingModal } from './DishRatingModal';
import { Film, BookOpen, Receipt, Bell, ChevronDown } from 'lucide-react';

export const CustomerView: React.FC = () => {
  const {
    activeRestaurant,
    activeTable,
    tables,
    setActiveTableId,
    customerSubTab,
    setCustomerSubTab,
    cart,
    orders,
    callWaiter,
    addToCart,
    addReview,
  } = useStore();

  const [selectedProductForCustomization, setSelectedProductForCustomization] = useState<Product | null>(null);
  const [ratingProduct, setRatingProduct] = useState<{ id: string; name: string } | null>(null);
  const [showTableSelector, setShowTableSelector] = useState(false);

  const restaurantTables = tables.filter(t => t.restaurantId === activeRestaurant.id);
  const tableOrders = orders.filter(o => o.tableId === activeTable?.id && o.restaurantId === activeRestaurant.id);

  const handleOpenCustomizer = (product: Product) => {
    setSelectedProductForCustomization(product);
  };

  const handleCloseCustomizer = () => {
    setSelectedProductForCustomization(null);
  };

  const handleAddToCart = (item: CartItem) => {
    addToCart(item);
  };

  return (
    <div className="flex-1 h-full min-h-0 flex flex-col justify-between text-neutral-900 bg-neutral-50 overflow-hidden">
      {/* Top Customer Header (Light Theme: White, Black, Red, Green) */}
      <header className="shrink-0 bg-white border-b border-neutral-200 px-3 sm:px-6 py-2.5 flex items-center justify-between shadow-xs z-20">
        <div className="flex items-center gap-3">
          <img
            src={activeRestaurant.logo}
            alt={activeRestaurant.name}
            className="w-10 h-10 rounded-full object-cover border-2 border-red-600 shadow-xs"
          />
          <div>
            <h1 className="font-extrabold text-sm sm:text-base text-neutral-900 leading-tight">
              {activeRestaurant.name}
            </h1>
            {/* Table Badge with quick changer */}
            <button
              type="button"
              onClick={() => setShowTableSelector(!showTableSelector)}
              className="flex items-center gap-1 text-[11px] font-bold text-red-600 hover:text-red-700 transition-colors"
            >
              <span>{activeTable ? activeTable.label : 'Selecione a Mesa'}</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick Call Waiter Button */}
        <div className="flex items-center gap-2">
          {activeTable?.waiterCalled ? (
            <span className="text-[11px] bg-red-50 text-red-700 border border-red-300 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 animate-pulse">
              <Bell className="w-3.5 h-3.5" />
              <span>Garçom a caminho</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => callWaiter(activeTable?.id, 'Atendimento na mesa')}
              aria-label="Chamar Garçom"
              className="bg-neutral-900 hover:bg-black text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
            >
              <Bell className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden xs:inline">Chamar Garçom</span>
            </button>
          )}
        </div>
      </header>

      {/* Table Selector Dropdown Modal */}
      {showTableSelector && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
        >
          <div className="bg-white border border-neutral-200 rounded-3xl max-w-xs w-full p-5 space-y-4 shadow-2xl text-neutral-900">
            <div>
              <h3 className="font-extrabold text-sm text-neutral-900">Simular Escaneamento de Mesa</h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Escolha a mesa para simular o autoatendimento sem login:
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
              {restaurantTables.map(tbl => (
                <button
                  key={tbl.id}
                  type="button"
                  onClick={() => {
                    setActiveTableId(tbl.id);
                    setShowTableSelector(false);
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all ${
                    tbl.id === activeTable?.id
                      ? 'bg-red-600 border-red-600 text-white shadow-sm'
                      : 'bg-neutral-50 border-neutral-300 text-neutral-800 hover:border-black'
                  }`}
                >
                  Mesa {tbl.number}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowTableSelector(false)}
              className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs py-2.5 rounded-xl"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Main Tab Content */}
      <main className="flex-1 min-h-0 overflow-y-auto w-full py-2 bg-neutral-50">
        {customerSubTab === 'reels' && (
          <ReelsFeed onOpenCustomizer={handleOpenCustomizer} />
        )}
        {customerSubTab === 'menu' && (
          <TraditionalMenu onOpenCustomizer={handleOpenCustomizer} />
        )}
        {customerSubTab === 'bill' && (
          <TableBillTab onOpenRateDish={(prod) => setRatingProduct(prod)} />
        )}
      </main>

      {/* Bottom Sticky Navigation Bar (Clean White, Black, Red, Green) */}
      <nav
        aria-label="Navegação da mesa"
        className="shrink-0 bg-white border-t border-neutral-200 py-2.5 px-4 flex items-center justify-around max-w-lg mx-auto w-full sm:rounded-t-2xl shadow-lg z-40"
      >
        {/* Reels Tab */}
        <button
          type="button"
          onClick={() => setCustomerSubTab('reels')}
          className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all relative ${
            customerSubTab === 'reels'
              ? 'text-red-600 font-black scale-105'
              : 'text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <Film className="w-5 h-5" />
          <span className="text-[11px]">Reels Feed</span>
          {customerSubTab === 'reels' && (
            <span className="absolute -top-1 right-2 w-2 h-2 rounded-full bg-red-600 animate-ping" />
          )}
        </button>

        {/* Cardápio Tradicional Tab */}
        <button
          type="button"
          onClick={() => setCustomerSubTab('menu')}
          className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all ${
            customerSubTab === 'menu'
              ? 'text-red-600 font-black scale-105'
              : 'text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[11px]">Cardápio</span>
        </button>

        {/* Minha Comanda / Mesa Tab */}
        <button
          type="button"
          onClick={() => setCustomerSubTab('bill')}
          className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all relative ${
            customerSubTab === 'bill'
              ? 'text-red-600 font-black scale-105'
              : 'text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <div className="relative">
            <Receipt className="w-5 h-5" />
            {cart.length > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-red-600 text-white font-extrabold text-[10px] w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                {cart.length}
              </span>
            )}
            {cart.length === 0 && tableOrders.length > 0 && (
              <span className="absolute -top-1 -right-1.5 bg-green-600 w-2 h-2 rounded-full" />
            )}
          </div>
          <span className="text-[11px]">Minha Mesa</span>
        </button>
      </nav>

      {/* Item Customizer Modal */}
      {selectedProductForCustomization && (
        <ItemCustomizerModal
          product={selectedProductForCustomization}
          onClose={handleCloseCustomizer}
          onAddToCart={handleAddToCart}
        />
      )}

      {/* Dish Rating Modal */}
      {ratingProduct && (
        <DishRatingModal
          product={ratingProduct}
          table={activeTable}
          onClose={() => setRatingProduct(null)}
          onSubmitReview={(reviewData) => {
            if (activeRestaurant) {
              addReview({
                ...reviewData,
                restaurantId: activeRestaurant.id,
                tableId: activeTable?.id || 'tbl_4',
                tableName: activeTable?.label || 'Mesa',
              });
            }
          }}
        />
      )}
    </div>
  );
};
