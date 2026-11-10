import React, { useRef } from 'react';
import { Order, OrderStatus } from '../../types';
import { Printer, FileText, CheckCircle2, X, Clock, ChefHat, Bell, Utensils } from 'lucide-react';

interface Props {
  order: Order;
  restaurantName: string;
  onClose: () => void;
  onUpdateStatus?: (orderId: string, status: OrderStatus) => void;
}

export const OrderDetailModal: React.FC<Props> = ({
  order,
  restaurantName,
  onClose,
  onUpdateStatus,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  // Formatted Order Code matching the attachment format (OD-11-10-WLHJ-14KBMAZL6)
  const formattedCode = `OD-${new Date(order.createdAt).toISOString().slice(2, 10).replace(/-/g, '-')}-${order.orderNumber}-${order.id.slice(4, 12).toUpperCase()}`;

  const formattedDate = new Date(order.createdAt).toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const formattedTime = new Date(order.createdAt).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handlePrint = (type: string) => {
    window.print();
  };

  const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case 'received':
        return 'Pedido Aceito';
      case 'preparing':
        return 'Em Preparo na Cozinha';
      case 'ready':
        return 'Pronto para Servir';
      case 'delivered':
        return 'Entregue na Mesa';
      case 'paid':
        return 'Finalizado / Pago';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const orderTypeLabel =
    order.orderType === 'delivery'
      ? 'Delivery'
      : order.orderType === 'retirada'
      ? 'Retirada Balcão'
      : `Consumo no Local (${order.tableName})`;

  const paymentMethodLabel =
    order.paymentMethod === 'pix'
      ? 'PIX'
      : order.paymentMethod === 'credit_card'
      ? 'Cartão de Crédito'
      : order.paymentMethod === 'debit_card'
      ? 'Cartão de Débito'
      : order.paymentMethod === 'cash'
      ? 'Dinheiro'
      : order.paymentLocation === 'cashier'
      ? 'Pagar no Caixa'
      : 'Pagar na Mesa';

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto"
    >
      <div className="bg-white border border-neutral-300 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Top Action Bar (Matching screenshot: Impressão Térmica, Imprimir, Imprimir fatura, Imprimir KOT) */}
        <div className="p-3 bg-neutral-100 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handlePrint('termica')}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Impressão Térmica</span>
            </button>
            <button
              type="button"
              onClick={() => handlePrint('padrao')}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>
            <button
              type="button"
              onClick={() => handlePrint('fatura')}
              className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Imprimir fatura</span>
            </button>
            <button
              type="button"
              onClick={() => handlePrint('kot')}
              className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span>Imprimir KOT</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar pedido"
            className="p-1.5 rounded-lg bg-neutral-200 hover:bg-neutral-300 text-neutral-800 transition-colors cursor-pointer ml-auto"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable & Screen Area */}
        <div ref={printRef} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-neutral-900 bg-white">
          {/* Dark Header Banner (From attachment: OD-11-10-WLHJ-14KBMAZL6) */}
          <div className="bg-[#374151] text-white px-4 py-2.5 rounded-t-lg font-mono font-black text-sm sm:text-base tracking-wider shadow-inner">
            {formattedCode}
          </div>

          {/* Restaurant & Date Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 border-b border-neutral-200 pb-3">
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
              {restaurantName}
            </h2>
            <span className="text-xs sm:text-sm text-neutral-600 font-medium">
              Pedido Feito: {formattedDate} - {formattedTime}
            </span>
          </div>

          {/* Details Grid (Matching Left and Right boxes in attachment) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Box: Detalhes do Cliente */}
            <div className="border border-neutral-200 rounded-lg p-4 space-y-1.5 text-xs sm:text-sm bg-neutral-50/50">
              <h3 className="font-bold text-neutral-900 text-sm border-b border-neutral-200 pb-1.5 mb-2">
                Detalhes do Cliente
              </h3>
              <p>
                <span className="font-semibold text-neutral-700">Nome: </span>
                <span className="text-neutral-900">{order.customerName || `Cliente ${order.tableName}`}</span>
              </p>
              <p>
                <span className="font-semibold text-neutral-700">E-mail: </span>
                <span className="text-neutral-900">{order.customerEmail || 'atendimento@mesa.local'}</span>
              </p>
              <p>
                <span className="font-semibold text-neutral-700">Número: </span>
                <span className="text-neutral-900">{order.customerPhone || '+55 (11) 98765-4321'}</span>
              </p>
              <p>
                <span className="font-semibold text-neutral-700">Endereço: </span>
                <span className="text-neutral-900 font-bold">{order.tableName}</span>
              </p>
              <div className="pt-2">
                <span className="font-bold text-neutral-900 block">Observação:</span>
                <p className="text-red-600 font-extrabold text-sm sm:text-base mt-0.5">
                  {order.notes || 'Nenhuma observação informada.'}
                </p>
              </div>
            </div>

            {/* Right Box: Status, Tipo de Pedido, Modo de Pagamento */}
            <div className="border border-neutral-200 rounded-lg overflow-hidden flex flex-col text-xs sm:text-sm">
              {/* STATUS row */}
              <div className="border-b border-neutral-200 text-center p-3 bg-neutral-50">
                <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                  STATUS
                </span>
                <span className="text-green-600 font-black text-base sm:text-lg">
                  {getStatusLabel(order.status)}
                </span>
              </div>

              {/* Two columns underneath: Tipo de Pedido & Modo de Pagamento */}
              <div className="grid grid-cols-2 divide-x divide-neutral-200 flex-1">
                <div className="p-3 text-center flex flex-col justify-center">
                  <span className="text-[11px] font-bold text-neutral-500 uppercase block mb-1">
                    Tipo de Pedido
                  </span>
                  <span className="text-red-600 font-black text-xs sm:text-sm">
                    {orderTypeLabel}
                  </span>
                </div>
                <div className="p-3 text-center flex flex-col justify-center">
                  <span className="text-[11px] font-bold text-neutral-500 uppercase block mb-1">
                    Modo de Pagamento
                  </span>
                  <span className="text-red-600 font-black text-xs sm:text-sm">
                    {paymentMethodLabel}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table (Matching row "2x Empadinha Frango e Requeijão R$20") */}
          <div className="border border-neutral-200 rounded-lg overflow-hidden">
            <div className="bg-neutral-100 px-4 py-2 border-b border-neutral-200 text-xs font-bold text-neutral-600 flex justify-between">
              <span>Itens do Pedido</span>
              <span>Subtotal</span>
            </div>
            <div className="divide-y divide-neutral-100">
              {order.items.map((item, idx) => (
                <div key={idx} className="p-3 sm:p-4 flex items-start justify-between gap-4 bg-white hover:bg-neutral-50/50">
                  <div className="space-y-1">
                    <div className="font-bold text-sm sm:text-base text-neutral-900 flex items-center gap-2">
                      <span className="font-black text-neutral-800">{item.quantity}x</span>
                      <span>{item.name}</span>
                    </div>

                    {/* Flavors */}
                    {item.selectedFlavors && item.selectedFlavors.length > 0 && (
                      <p className="text-xs text-neutral-600 pl-6">
                        <span className="font-semibold">Sabores:</span>{' '}
                        {item.selectedFlavors.map(f => f.name).join(', ')}
                      </p>
                    )}

                    {/* Quantity-based addons (+2 Queijo, +1 Bacon) */}
                    {item.quantitySelections &&
                      Object.entries(item.quantitySelections).map(([grpId, qItems]) => {
                        if (!qItems || qItems.length === 0) return null;
                        return (
                          <p key={grpId} className="text-xs text-neutral-700 pl-6 font-medium">
                            <span className="font-bold text-red-600">Adicionais:</span>{' '}
                            {qItems.map(q => `${q.quantity}x ${q.name} (+R$ ${(q.price * q.quantity).toFixed(2)})`).join(', ')}
                          </p>
                        );
                      })}

                    {/* Custom single/multi selections */}
                    {item.customSelections &&
                      Object.entries(item.customSelections).map(([grpId, selections]) => {
                        if (!selections || selections.length === 0) return null;
                        return (
                          <p key={grpId} className="text-xs text-neutral-600 pl-6">
                            {selections.map(s => `${s.name} ${s.price > 0 ? `(+R$ ${s.price.toFixed(2)})` : ''}`).join(', ')}
                          </p>
                        );
                      })}

                    {/* Item Notes */}
                    {item.notes && (
                      <p className="text-xs text-red-600 font-bold pl-6 italic">
                        Obs item: {item.notes}
                      </p>
                    )}
                  </div>

                  <div className="font-bold text-sm sm:text-base text-neutral-900 shrink-0 text-right">
                    R$ {(item.finalUnitPrice * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Summary (SubTotal, Taxa de Entrega / Serviço, Total) */}
          <div className="flex justify-end pt-2">
            <div className="w-full sm:w-72 border border-neutral-200 rounded-lg overflow-hidden text-xs sm:text-sm divide-y divide-neutral-200">
              <div className="flex justify-between p-2.5 bg-neutral-50">
                <span className="font-medium text-neutral-600">SubTotal</span>
                <span className="font-bold text-neutral-900">R$ {order.subtotal.toFixed(2)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between p-2.5 bg-neutral-50 text-green-700">
                  <span className="font-medium">Desconto ({order.couponCode || 'Cupom'})</span>
                  <span className="font-bold">-R$ {order.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between p-2.5 bg-neutral-50">
                <span className="font-medium text-neutral-600">Taxa de Serviço / Entrega</span>
                <span className="font-bold text-neutral-900">
                  R$ {(order.serviceTax || order.deliveryFee || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between p-3 bg-neutral-100 text-sm sm:text-base font-black text-neutral-900">
                <span>Total</span>
                <span className="text-red-600">R$ {order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer: Quick Status Transitions for Kitchen / Waiter */}
        {onUpdateStatus && (
          <div className="p-3 bg-neutral-50 border-t border-neutral-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <span className="text-xs font-bold text-neutral-500">
              Avançar status deste pedido:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {order.status === 'received' && (
                <button
                  type="button"
                  onClick={() => onUpdateStatus(order.id, 'preparing')}
                  className="bg-neutral-900 hover:bg-black text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <ChefHat className="w-3.5 h-3.5 text-red-500" />
                  <span>Iniciar Preparo na Cozinha</span>
                </button>
              )}
              {order.status === 'preparing' && (
                <button
                  type="button"
                  onClick={() => onUpdateStatus(order.id, 'ready')}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Marcar como Pronto para Servir</span>
                </button>
              )}
              {order.status === 'ready' && (
                <button
                  type="button"
                  onClick={() => onUpdateStatus(order.id, 'delivered')}
                  className="bg-neutral-900 hover:bg-black text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Utensils className="w-3.5 h-3.5 text-green-400" />
                  <span>Confirmar Entrega na Mesa</span>
                </button>
              )}
              {order.status === 'delivered' && (
                <button
                  type="button"
                  onClick={() => onUpdateStatus(order.id, 'paid')}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Marcar como Pago / Finalizar</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-bold text-xs px-4 py-2 rounded-xl cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
