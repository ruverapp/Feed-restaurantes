import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Tag,
  Clock,
  Send,
  Star,
  Receipt,
  Bell,
  CheckCircle2,
  Store,
  CreditCard,
  QrCode,
  Banknote,
  ArrowRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  onOpenRateDish?: (product: { id: string; name: string }) => void;
  onGoToMenu?: () => void;
}

export const CartTab: React.FC<Props> = ({ onOpenRateDish, onGoToMenu }) => {
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
  const [paymentLocationChoice, setPaymentLocationChoice] = useState<'cashier' | 'table'>('cashier');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'pix' | 'credit_card' | 'debit_card' | 'cash'>('pix');
  const [showCallWaiterModal, setShowCallWaiterModal] = useState(false);
  const [callReason, setCallReason] = useState('Atendimento na mesa');

  // Orders for this table
  const tableOrders = orders.filter(
    o => o.tableId === activeTable?.id && o.restaurantId === activeRestaurant.id
  );

  const cartSubtotal = cart.reduce((sum, item) => sum + item.finalUnitPrice * item.quantity, 0);

  // Validate coupon
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

  // Total already consumed in table
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

  const handleConfirmBill = () => {
    if (!activeTable) return;
    requestBill(activeTable.id, selectedPaymentMethod, paymentLocationChoice);
    setShowBillModal(false);
  };

  return (
    <div className="space-y-4 pb-28 max-w-2xl mx-auto px-3 sm:px-4 text-neutral-900">
      {/* Table Status Bar */}
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
              <span>Garçom Notificado</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowCallWaiterModal(true)}
              className="bg-neutral-900 hover:bg-black text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer w-full sm:w-auto"
            >
              <Bell className="w-3.5 h-3.5 text-red-400" />
              <span>Chamar Garçom</span>
            </button>
          )}
        </div>
      </div>

      {/* SECTION 1: Carrinho de Itens Pendentes */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-4 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-red-600" />
            <h2 className="font-black text-neutral-900 text-base">
              Itens no Carrinho ({cart.reduce((sum, i) => sum + i.quantity, 0)})
            </h2>
          </div>
          {cart.length > 0 && (
            <span className="text-xs font-bold text-neutral-500">
              Pronto para enviar
            </span>
          )}
        </div>

        {cart.length === 0 ? (
          <div className="text-center py-8 text-neutral-500 space-y-3">
            <ShoppingBag className="w-10 h-10 mx-auto text-neutral-300" />
            <p className="font-bold text-sm text-neutral-800">Seu carrinho está vazio.</p>
            <p className="text-xs max-w-xs mx-auto">
              Navegue pelos vídeos no Reels ou no Cardápio para adicionar delícias à comanda!
            </p>
            {onGoToMenu && (
              <button
                type="button"
                onClick={onGoToMenu}
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer shadow-xs inline-block"
              >
                Explorar Cardápio
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="divide-y divide-neutral-100">
              {cart.map(item => (
                <div key={item.cartItemId} className="py-3.5 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {item.mediaUrl && (
                      <img
                        src={item.mediaUrl}
                        alt={item.name}
                        className="w-14 h-14 rounded-xl object-cover border border-neutral-200 shrink-0"
                      />
                    )}
                    <div className="space-y-1">
                      <div className="font-bold text-sm text-neutral-900">
                        {item.name}
                      </div>

                      {/* Flavors */}
                      {item.selectedFlavors && (
                        <p className="text-xs text-neutral-600">
                          <span className="font-semibold">Sabores:</span>{' '}
                          {item.selectedFlavors.map(f => f.name).join(', ')}
                        </p>
                      )}

                      {/* Quantity Addons (+2 Queijo, etc.) */}
                      {item.quantitySelections &&
                        Object.entries(item.quantitySelections).map(([grpId, qItems]) => {
                          if (!qItems || qItems.length === 0) return null;
                          return (
                            <p key={grpId} className="text-xs text-neutral-700 font-medium">
                              <span className="font-bold text-red-600">Adicionais:</span>{' '}
                              {qItems.map(q => `${q.quantity}x ${q.name}`).join(', ')}
                            </p>
                          );
                        })}

                      {/* Custom selections */}
                      {item.customSelections &&
                        Object.entries(item.customSelections).map(([grpId, selections]) => {
                          if (!selections || selections.length === 0) return null;
                          return (
                            <p key={grpId} className="text-xs text-neutral-600">
                              {selections.map(s => s.name).join(', ')}
                            </p>
                          );
                        })}

                      {item.notes && (
                        <p className="text-xs text-red-600 italic font-medium">
                          Obs: {item.notes}
                        </p>
                      )}

                      <div className="font-extrabold text-sm text-neutral-900 pt-0.5">
                        R$ {(item.finalUnitPrice * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Quantity Stepper & Remove */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1.5 bg-neutral-100 rounded-xl p-1 border border-neutral-200">
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(item.cartItemId, -1)}
                        className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-neutral-700 shadow-xs hover:bg-neutral-50 transition-colors cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center font-black text-xs text-neutral-900">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(item.cartItemId, 1)}
                        className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-neutral-700 shadow-xs hover:bg-neutral-50 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.cartItemId)}
                      className="p-2 text-neutral-400 hover:text-red-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Coupon Code Input */}
            <form onSubmit={handleApplyCoupon} className="space-y-1 pt-1">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Cupom de desconto (Ex: BENVENUTO15)"
                    className="w-full pl-9 pr-3 py-2 text-xs font-bold rounded-xl border border-neutral-300 bg-neutral-50 uppercase text-neutral-900 focus:outline-none focus:border-red-600"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-neutral-900 hover:bg-black text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer shrink-0"
                >
                  Aplicar
                </button>
              </div>

              {couponMessage && (
                <p
                  className={`text-xs font-bold px-2 py-1 rounded-lg ${
                    couponMessage.type === 'success'
                      ? 'text-green-700 bg-green-50'
                      : 'text-red-700 bg-red-50'
                  }`}
                >
                  {couponMessage.text}
                </p>
              )}
            </form>

            {/* Kitchen Notes */}
            <div className="space-y-1">
              <label htmlFor="cart-notes" className="text-xs font-bold text-neutral-700 block">
                Observação geral para a Cozinha:
              </label>
              <input
                id="cart-notes"
                type="text"
                value={orderNotes}
                onChange={e => setOrderNotes(e.target.value)}
                placeholder="Ex: Trazer pratos para compartilhar, talheres adicionais..."
                className="w-full p-2.5 rounded-xl border border-neutral-300 bg-neutral-50 text-xs text-neutral-900 focus:outline-none focus:border-red-600"
              />
            </div>

            {/* Financial Summary */}
            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal do Pedido:</span>
                <span className="font-bold text-neutral-900">R$ {cartSubtotal.toFixed(2)}</span>
              </div>
              {previewDiscount > 0 && (
                <div className="flex justify-between text-green-700 font-bold">
                  <span>Desconto ({appliedCoupon?.code}):</span>
                  <span>-R$ {previewDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-neutral-900 border-t border-neutral-200 pt-2">
                <span>Total a Enviar:</span>
                <span className="text-red-600 text-base">R$ {cartTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Submit Order Button */}
            <button
              type="button"
              onClick={handleConfirmOrder}
              disabled={isSubmitting}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all cursor-pointer text-sm"
            >
              <Send className="w-4 h-4" />
              <span>
                {isSubmitting ? 'Enviando à Cozinha...' : `Enviar Pedido à Cozinha • R$ ${cartTotal.toFixed(2)}`}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* SECTION 2: Histórico de Pedidos em Andamento na Mesa */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-4 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-red-600" />
            <h3 className="font-black text-neutral-900 text-sm sm:text-base">
              Pedidos em Andamento na Mesa
            </h3>
          </div>
          <span className="text-xs text-neutral-500 font-bold">
            {tableOrders.length} pedido(s)
          </span>
        </div>

        {tableOrders.length === 0 ? (
          <p className="text-xs text-neutral-500 text-center py-4">
            Nenhum pedido enviado para a cozinha ainda.
          </p>
        ) : (
          <div className="space-y-3">
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

                  {/* Stepper */}
                  <div className="grid grid-cols-4 gap-1 text-center text-[10px] pt-1">
                    <div className={`p-1.5 rounded-lg font-bold ${statusStep >= 1 ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-400'}`}>
                      1. Recebido
                    </div>
                    <div className={`p-1.5 rounded-lg font-bold ${statusStep >= 2 ? 'bg-red-600 text-white' : 'bg-neutral-200 text-neutral-400'}`}>
                      2. Fogão
                    </div>
                    <div className={`p-1.5 rounded-lg font-bold ${statusStep >= 3 ? 'bg-green-600 text-white' : 'bg-neutral-200 text-neutral-400'}`}>
                      3. Pronto
                    </div>
                    <div className={`p-1.5 rounded-lg font-bold ${statusStep >= 4 ? 'bg-green-700 text-white' : 'bg-neutral-200 text-neutral-400'}`}>
                      4. Servido
                    </div>
                  </div>

                  {/* Items summary */}
                  <div className="text-xs text-neutral-700 space-y-1">
                    {order.items.map(i => (
                      <div key={i.cartItemId} className="flex justify-between items-center">
                        <span>
                          {i.quantity}x {i.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">
                            R$ {(i.finalUnitPrice * i.quantity).toFixed(2)}
                          </span>
                          {order.status === 'delivered' && onOpenRateDish && (
                            <button
                              type="button"
                              onClick={() => onOpenRateDish({ id: i.productId, name: i.name })}
                              className="text-[10px] bg-white border border-neutral-300 hover:border-yellow-500 text-neutral-700 px-1.5 py-0.5 rounded font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                              <span>Avaliar</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 3: Fechar Conta da Mesa (Opções Caixa vs Mesa) */}
      {ordersTotalSpent > 0 && (
        <div className="bg-white border-2 border-neutral-900 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div>
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider block">
              Total Consumido na Mesa
            </span>
            <div className="text-2xl font-black text-red-600">
              R$ {ordersTotalSpent.toFixed(2)}
            </div>
            <p className="text-xs text-neutral-600 mt-0.5">
              Escolha pagar diretamente no caixa ou solicitar maquininha na mesa
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowBillModal(true)}
            className="w-full sm:w-auto bg-neutral-900 hover:bg-black text-white font-black py-3 px-6 rounded-xl flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
          >
            <Receipt className="w-4 h-4 text-red-400" />
            <span>Pedir a Conta / Fechamento</span>
          </button>
        </div>
      )}

      {/* Modal: Fechar Conta (Caixa vs Mesa) */}
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
                <h3 className="font-black text-neutral-900 text-base">Fechamento da Mesa</h3>
              </div>
              <span className="text-base font-black text-red-600">
                R$ {ordersTotalSpent.toFixed(2)}
              </span>
            </div>

            {/* Primary Choice: Pagar no Caixa vs Pagar na Mesa */}
            <div className="space-y-2">
              <label className="font-bold text-xs text-neutral-700 block">
                Onde você prefere realizar o pagamento?
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentLocationChoice('cashier')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                    paymentLocationChoice === 'cashier'
                      ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                      : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-400'
                  }`}
                >
                  <Store className="w-5 h-5" />
                  <span>Pagar no Caixa (Balcão)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentLocationChoice('table')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                    paymentLocationChoice === 'table'
                      ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                      : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-400'
                  }`}
                >
                  <Bell className="w-5 h-5" />
                  <span>Pagar na Mesa (Garçom)</span>
                </button>
              </div>
            </div>

            {paymentLocationChoice === 'cashier' ? (
              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3.5 space-y-2 text-xs">
                <p className="font-bold text-neutral-900">
                  Como funciona o pagamento no caixa:
                </p>
                <p className="text-neutral-600">
                  Basta dirigir-se ao caixa/balcão e informar que você está na{' '}
                  <span className="font-black text-red-600">{activeTable?.label}</span>. O operador
                  localizará sua comanda para pagamento na maquininha ou dinheiro.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-neutral-600">
                  Escolha o método desejado para o garçom levar a maquininha:
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
                        className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-red-50 border-red-600 text-red-700 shadow-xs'
                            : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-400'
                        }`}
                      >
                        <Icon className="w-4 h-4 text-neutral-900" />
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBillModal(false)}
                className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs py-3 rounded-xl transition-colors cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleConfirmBill}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black text-xs py-3 rounded-xl transition-colors cursor-pointer shadow-md"
              >
                {paymentLocationChoice === 'cashier'
                  ? 'Vou Pagar no Caixa'
                  : 'Chamar Garçom com Maquininha'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Chamado do Garçom */}
      {showCallWaiterModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
        >
          <div className="bg-white border border-neutral-200 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 border-b border-neutral-200 pb-3">
              <Bell className="w-5 h-5 text-red-600" />
              <h3 className="font-black text-neutral-900 text-base">Chamar Garçom</h3>
            </div>

            <p className="text-xs text-neutral-600">
              Qual o motivo do seu chamado para a {activeTable?.label}?
            </p>

            <div className="space-y-2">
              {[
                'Atendimento geral na mesa',
                'Dúvidas sobre o cardápio',
                'Trazer guardanapos / talheres adicionais',
                'Trocar bebida ou gelo',
              ].map(reason => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setCallReason(reason)}
                  className={`w-full text-left p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    callReason === reason
                      ? 'bg-red-50 border-red-600 text-red-700'
                      : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-300'
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
                className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs py-2.5 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (activeTable) {
                    callWaiter(activeTable.id, callReason);
                  }
                  setShowCallWaiterModal(false);
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black text-xs py-2.5 rounded-xl cursor-pointer shadow-xs"
              >
                Confirmar Chamado
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
