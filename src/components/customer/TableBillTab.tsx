import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  Receipt,
  Bell,
  Trash2,
  Plus,
  Minus,
  Tag,
  Clock,
  UtensilsCrossed,
  CreditCard,
  QrCode,
  Banknote,
  Send,
  Star,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  onOpenRateDish?: (product: { id: string; name: string }) => void;
}

export const TableBillTab: React.FC<Props> = ({ onOpenRateDish }) => {
  const {
    activeRestaurant,
    activeTable,
    cart,
    orders,
    coupons,
    updateCartQuantity,
    removeFromCart,
    submitOrder,
    callWaiter,
    requestBill,
  } = useStore();

  const [couponCode, setCouponCode] = useState('');
  const [couponMessage, setCouponMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [orderNotes, setOrderNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'pix' | 'credit_card' | 'debit_card' | 'cash'>('pix');
  const [showCallWaiterModal, setShowCallWaiterModal] = useState(false);
  const [callReason, setCallReason] = useState('Atendimento na mesa');

  // Filter orders for active table
  const tableOrders = orders.filter(
    o => o.tableId === activeTable?.id && o.restaurantId === activeRestaurant.id
  );

  const cartSubtotal = cart.reduce((sum, item) => sum + item.finalUnitPrice * item.quantity, 0);

  // Validate coupon preview
  const appliedCoupon = couponCode
    ? coupons.find(c => c.restaurantId === activeRestaurant.id && c.code.toUpperCase() === couponCode.trim().toUpperCase())
    : null;

  let previewDiscount = 0;
  if (appliedCoupon && appliedCoupon.active && cartSubtotal >= appliedCoupon.minOrderValue) {
    if (appliedCoupon.discountType === 'percentage') {
      previewDiscount = (cartSubtotal * appliedCoupon.discountValue) / 100;
    } else {
      previewDiscount = Math.min(appliedCoupon.discountValue, cartSubtotal);
    }
  }

  const cartTotal = Math.max(0, cartSubtotal - previewDiscount);

  // Total already spent in table orders
  const ordersTotalSpent = tableOrders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    if (appliedCoupon && appliedCoupon.active) {
      if (cartSubtotal < appliedCoupon.minOrderValue) {
        setCouponMessage({
          type: 'error',
          text: `Pedido mínimo de R$ ${appliedCoupon.minOrderValue.toFixed(2)} para este cupom.`,
        });
      } else {
        setCouponMessage({
          type: 'success',
          text: `Cupom ${appliedCoupon.code} aplicado: -R$ ${previewDiscount.toFixed(2)}!`,
        });
      }
    } else {
      setCouponMessage({
        type: 'error',
        text: 'Cupom inválido ou expirado.',
      });
    }
  };

  const handleConfirmOrder = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);
    try {
      await submitOrder(orderNotes, previewDiscount > 0 ? couponCode : undefined);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
      setOrderNotes('');
      setCouponCode('');
      setCouponMessage(null);
    } catch (err: any) {
      alert(err.message || 'Erro ao enviar pedido.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmCallWaiter = () => {
    if (!activeTable) return;
    callWaiter(activeTable.id, callReason);
    setShowCallWaiterModal(false);
  };

  const handleConfirmBill = () => {
    if (!activeTable) return;
    requestBill(activeTable.id, selectedPaymentMethod);
    setShowBillModal(false);
  };

  return (
    <div className="space-y-4 pb-28 max-w-2xl mx-auto px-3 sm:px-4 text-neutral-900">
      {/* Table Status Banner */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-neutral-900 text-white flex items-center justify-center font-black text-lg shrink-0">
            {activeTable?.number || '0'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-neutral-900 font-black text-base">
                {activeTable?.label || 'Mesa Selecionada'}
              </span>
              <span className="text-[10px] bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-green-600" />
                Conectado
              </span>
            </div>
            <p className="text-xs text-neutral-600 mt-0.5">
              {activeRestaurant.name} • Pedido sem login
            </p>
          </div>
        </div>

        {/* Waiter Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {activeTable?.waiterCalled ? (
            <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 px-3 py-2 rounded-xl text-red-700 text-xs font-bold animate-pulse w-full sm:w-auto justify-center">
              <Bell className="w-4 h-4 text-red-600" />
              <span>Garçom a caminho</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowCallWaiterModal(true)}
              className="bg-neutral-900 hover:bg-black text-white font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all w-full sm:w-auto active:scale-95 cursor-pointer"
            >
              <Bell className="w-4 h-4 text-white" />
              <span>Chamar Garçom</span>
            </button>
          )}

          {tableOrders.length > 0 && (
            <button
              type="button"
              onClick={() => setShowBillModal(true)}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all w-full sm:w-auto shrink-0 active:scale-95 cursor-pointer shadow-xs"
            >
              <Receipt className="w-4 h-4" />
              <span>Pedir Conta</span>
            </button>
          )}
        </div>
      </div>

      {/* Cart (Pending items) */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-4 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-black text-neutral-900 text-sm sm:text-base flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4 text-red-600" />
              Itens no Carrinho (Esta rodada)
            </h3>
            <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full font-bold">
              {cart.length}
            </span>
          </div>
          {cart.length > 0 && (
            <span className="text-xs text-neutral-600">
              Subtotal: <strong className="text-neutral-900">R$ {cartSubtotal.toFixed(2)}</strong>
            </span>
          )}
        </div>

        {cart.length === 0 ? (
          <div className="py-6 text-center text-neutral-500">
            <p className="text-sm font-bold text-neutral-800">Nenhum item pendente no carrinho.</p>
            <p className="text-xs text-neutral-500 mt-1">
              Deslize no Reels Feed ou navegue pelo Cardápio para escolher seus pratos.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {cart.map(item => (
              <div
                key={item.cartItemId}
                className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3 min-w-0">
                  {item.mediaUrl && (
                    <img
                      src={item.mediaUrl}
                      alt={item.name}
                      className="w-12 h-12 rounded-lg object-cover bg-neutral-200 shrink-0 border border-neutral-200"
                    />
                  )}
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-neutral-900 truncate">{item.name}</h4>
                    {item.selectedFlavors && item.selectedFlavors.length > 0 && (
                      <p className="text-xs text-red-600 font-semibold mt-0.5">
                        Sabores: {item.selectedFlavors.map(f => f.name).join(' • ')}
                      </p>
                    )}
                    {item.selectedAddons && item.selectedAddons.length > 0 && (
                      <p className="text-xs text-neutral-600">
                        Adicionais: {item.selectedAddons.map(a => a.name).join(', ')}
                      </p>
                    )}
                    {item.customSelections && Object.keys(item.customSelections).length > 0 && (
                      <div className="text-xs text-neutral-600">
                        {Object.values(item.customSelections).flat().map((sel, i) => (
                          <span key={i} className="inline-block bg-white border border-neutral-200 px-1.5 py-0.2 rounded text-[11px] mr-1 mt-0.5">
                            {sel.name} {sel.price > 0 && `(+R$ ${sel.price.toFixed(2)})`}
                          </span>
                        ))}
                      </div>
                    )}
                    {item.notes && (
                      <p className="text-[11px] text-neutral-500 italic mt-0.5">Obs: {item.notes}</p>
                    )}
                    <span className="text-xs font-bold text-neutral-900 mt-1 block">
                      R$ {item.finalUnitPrice.toFixed(2)} un.
                    </span>
                  </div>
                </div>

                {/* Quantity and Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-200">
                  <div className="flex items-center bg-white border border-neutral-300 rounded-lg p-0.5">
                    <button
                      type="button"
                      onClick={() => updateCartQuantity(item.cartItemId, -1)}
                      aria-label="Diminuir"
                      className="w-7 h-7 flex items-center justify-center text-neutral-700 hover:text-black cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-6 text-center text-xs font-black text-neutral-900">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateCartQuantity(item.cartItemId, 1)}
                      aria-label="Aumentar"
                      className="w-7 h-7 flex items-center justify-center text-neutral-700 hover:text-black cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <span className="text-sm font-black text-neutral-900 w-20 text-right">
                    R$ {(item.finalUnitPrice * item.quantity).toFixed(2)}
                  </span>

                  <button
                    type="button"
                    onClick={() => removeFromCart(item.cartItemId)}
                    aria-label="Remover item"
                    className="p-1.5 text-neutral-400 hover:text-red-600 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {/* Coupon Code Input */}
            <form onSubmit={handleApplyCoupon} className="pt-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={couponCode}
                    onChange={e => {
                      setCouponCode(e.target.value.toUpperCase());
                      setCouponMessage(null);
                    }}
                    placeholder="Cupom de desconto (ex: BEMVINDO10)"
                    className="w-full bg-white border border-neutral-300 rounded-xl pl-9 pr-3 py-2 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-red-600 uppercase font-mono font-bold"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-neutral-900 hover:bg-black text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  Aplicar
                </button>
              </div>

              {couponMessage && (
                <p
                  className={`text-xs mt-1.5 font-bold ${
                    couponMessage.type === 'success' ? 'text-green-700' : 'text-red-600'
                  }`}
                >
                  {couponMessage.text}
                </p>
              )}
            </form>

            {/* Summary calculation */}
            <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200 space-y-1.5 text-xs">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal dos novos itens:</span>
                <span>R$ {cartSubtotal.toFixed(2)}</span>
              </div>
              {previewDiscount > 0 && (
                <div className="flex justify-between text-green-700 font-bold">
                  <span>Desconto ({couponCode}):</span>
                  <span>-R$ {previewDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-neutral-900 pt-1 border-t border-neutral-200">
                <span>Total deste pedido:</span>
                <span className="text-red-600 font-black">R$ {cartTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Kitchen Instructions */}
            <div>
              <input
                type="text"
                value={orderNotes}
                onChange={e => setOrderNotes(e.target.value)}
                placeholder="Observações gerais para a cozinha..."
                className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-red-600"
              />
            </div>

            {/* Confirm & Send Button */}
            <button
              type="button"
              onClick={handleConfirmOrder}
              disabled={isSubmitting}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-black text-sm py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-red-600/20 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>
                {isSubmitting ? 'Enviando à Cozinha...' : `Enviar Pedido à Cozinha • R$ ${cartTotal.toFixed(2)}`}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Live Table Orders (History & Real-time Progress) */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-4 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
          <h3 className="font-black text-neutral-900 text-sm sm:text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-red-600" />
            Histórico de Pedidos da Mesa
          </h3>
          <span className="text-xs text-neutral-500 font-bold">
            {tableOrders.length} pedido(s)
          </span>
        </div>

        {tableOrders.length === 0 ? (
          <p className="text-xs text-neutral-500 text-center py-4">
            Nenhum pedido enviado nesta mesa ainda.
          </p>
        ) : (
          <div className="space-y-4">
            {tableOrders.map(order => {
              const statusStep =
                order.status === 'received'
                  ? 1
                  : order.status === 'preparing'
                  ? 2
                  : order.status === 'ready'
                  ? 3
                  : order.status === 'delivered'
                  ? 4
                  : 0;

              return (
                <div
                  key={order.id}
                  className="bg-neutral-50 border border-neutral-200 rounded-xl p-3.5 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-black text-neutral-900 text-sm">
                        Pedido #{order.orderNumber}
                      </span>
                      <span className="text-[11px] text-neutral-500 ml-2">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                        order.status === 'received'
                          ? 'bg-neutral-200 text-neutral-800 border-neutral-300'
                          : order.status === 'preparing'
                          ? 'bg-red-50 text-red-700 border-red-200 animate-pulse'
                          : order.status === 'ready'
                          ? 'bg-green-100 text-green-800 border-green-300'
                          : order.status === 'delivered'
                          ? 'bg-green-600 text-white border-green-600'
                          : 'bg-neutral-200 text-neutral-700 border-neutral-300'
                      }`}
                    >
                      {order.status === 'received' && 'Na Fila da Cozinha'}
                      {order.status === 'preparing' && 'Em Preparo no Fogão'}
                      {order.status === 'ready' && 'Pronto para Servir!'}
                      {order.status === 'delivered' && 'Entregue na Mesa'}
                      {order.status === 'paid' && 'Conta Paga'}
                      {order.status === 'cancelled' && 'Cancelado'}
                    </span>
                  </div>

                  {/* Status Progress Stepper */}
                  <div className="grid grid-cols-4 gap-1 text-center text-[10px] pt-1">
                    <div className={`p-1.5 rounded-lg font-bold ${statusStep >= 1 ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-400'}`}>
                      1. Recebido
                    </div>
                    <div className={`p-1.5 rounded-lg font-bold ${statusStep >= 2 ? 'bg-red-600 text-white' : 'bg-neutral-200 text-neutral-400'}`}>
                      2. Preparando
                    </div>
                    <div className={`p-1.5 rounded-lg font-bold ${statusStep >= 3 ? 'bg-green-600 text-white' : 'bg-neutral-200 text-neutral-400'}`}>
                      3. Pronto
                    </div>
                    <div className={`p-1.5 rounded-lg font-bold ${statusStep >= 4 ? 'bg-black text-white' : 'bg-neutral-200 text-neutral-400'}`}>
                      4. Na Mesa
                    </div>
                  </div>

                  {/* Items list with Dish Rating button */}
                  <div className="space-y-2 pt-2 border-t border-neutral-200 text-xs">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-neutral-800">
                        <div>
                          <span className="font-bold">
                            {item.quantity}x {item.name}
                          </span>
                          {item.selectedFlavors && (
                            <span className="text-[11px] text-red-600 block">
                              Sabores: {item.selectedFlavors.map(f => f.name).join(' • ')}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-neutral-900">
                            R$ {(item.finalUnitPrice * item.quantity).toFixed(2)}
                          </span>

                          {/* Rate Dish button if delivered or ready */}
                          {(order.status === 'delivered' || order.status === 'ready') && onOpenRateDish && (
                            <button
                              type="button"
                              onClick={() => onOpenRateDish({ id: item.productId, name: item.name })}
                              className="text-[11px] bg-green-50 hover:bg-green-100 text-green-700 border border-green-300 px-2 py-1 rounded-lg font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Star className="w-3 h-3 fill-green-600 text-green-600" />
                              <span>Avaliar</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-neutral-200 flex justify-between items-center text-xs">
                    <span className="text-neutral-500 font-semibold">Total deste pedido:</span>
                    <span className="font-black text-neutral-900 text-sm">
                      R$ {order.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Total Account summary */}
            <div className="bg-neutral-50 border border-neutral-300 rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-neutral-500 font-semibold">Total Consumido na Mesa</span>
                <p className="text-xl font-black text-neutral-900">
                  R$ {ordersTotalSpent.toFixed(2)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowBillModal(true)}
                className="bg-black hover:bg-neutral-800 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                Encerrar & Pagar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Call Waiter Modal */}
      {showCallWaiterModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
        >
          <div className="bg-white border border-neutral-200 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-red-600" />
              <h3 className="font-black text-neutral-900 text-base">Chamar Garçom</h3>
            </div>
            <p className="text-xs text-neutral-600">
              Selecione o motivo para que a equipe venha com o item correto:
            </p>

            <div className="space-y-2">
              {[
                'Atendimento geral na mesa',
                'Pedir mais gelo e limão',
                'Trazer mais pratos e talheres',
                'Dúvida sobre os pratos',
                'Outro pedido rápido',
              ].map(reason => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setCallReason(reason)}
                  className={`w-full text-left p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    callReason === reason
                      ? 'bg-red-50 border-red-600 text-red-700'
                      : 'bg-white border-neutral-200 text-neutral-800 hover:border-neutral-400'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCallWaiterModal(false)}
                className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmCallWaiter}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black text-xs py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                Confirmar Chamado
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bill Request Modal */}
      {showBillModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
        >
          <div className="bg-white border border-neutral-200 rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-red-600" />
                <h3 className="font-black text-neutral-900 text-base">Fechar Conta da Mesa</h3>
              </div>
              <span className="text-base font-black text-red-600">
                R$ {ordersTotalSpent.toFixed(2)}
              </span>
            </div>

            <p className="text-xs text-neutral-600">
              Escolha a forma de pagamento desejada. O garçom receberá a notificação em tempo real:
            </p>

            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'pix', label: 'PIX (QR Code)', icon: QrCode },
                { id: 'credit_card', label: 'Cartão de Crédito', icon: CreditCard },
                { id: 'debit_card', label: 'Cartão de Débito', icon: CreditCard },
                { id: 'cash', label: 'Dinheiro', icon: Banknote },
              ].map(opt => {
                const Icon = opt.icon;
                const isSelected = selectedPaymentMethod === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedPaymentMethod(opt.id as any)}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-red-50 border-red-600 text-red-700 shadow-xs'
                        : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-400'
                    }`}
                  >
                    <Icon className="w-5 h-5 text-neutral-900" />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>

            {selectedPaymentMethod === 'pix' && (
              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-center space-y-2">
                <p className="text-[11px] text-neutral-600">
                  Chave PIX: <span className="font-mono text-neutral-900 font-bold">financeiro@{activeRestaurant.slug}.com.br</span>
                </p>
                <div className="inline-block p-2 bg-white rounded-lg border border-neutral-200">
                  <div className="w-28 h-28 bg-neutral-900 text-white flex items-center justify-center text-[10px] text-center p-2 font-mono font-bold rounded">
                    [QR Code PIX R$ {ordersTotalSpent.toFixed(2)}]
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBillModal(false)}
                className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleConfirmBill}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black text-xs py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                Solicitar Fechamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
