import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { Table, Order } from '../../types';
import {
  CreditCard,
  QrCode,
  Banknote,
  Printer,
  CheckCircle2,
  Search,
  Receipt,
  Clock,
  ArrowRight,
  TrendingUp,
  Percent,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const CashierView: React.FC = () => {
  const {
    activeRestaurant,
    tables,
    orders,
    settleTableBill,
  } = useStore();

  const [searchTableQuery, setSearchTableQuery] = useState('');
  const [selectedTableId, setSelectedTableId] = useState<string>(() => {
    // Default to first table with bill requested or occupied
    const restaurantTables = tables.filter(t => t.restaurantId === activeRestaurant.id);
    const withBill = restaurantTables.find(t => t.status === 'bill_requested');
    if (withBill) return withBill.id;
    const occupied = restaurantTables.find(t => t.status === 'occupied');
    if (occupied) return occupied.id;
    return restaurantTables[0]?.id || '';
  });

  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card' | 'debit_card' | 'cash'>('pix');
  const [includeServiceTax, setIncludeServiceTax] = useState(true);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [cashReceived, setCashReceived] = useState<string>('');
  const [showPaidSuccessToast, setShowPaidSuccessToast] = useState(false);

  const restaurantTables = tables.filter(t => t.restaurantId === activeRestaurant.id);
  const restaurantOrders = orders.filter(o => o.restaurantId === activeRestaurant.id);

  // Selected Table
  const selectedTable = restaurantTables.find(t => t.id === selectedTableId);

  // Active / Unpaid orders for this table
  const tableActiveOrders = restaurantOrders.filter(
    o => o.tableId === selectedTableId && o.status !== 'cancelled' && o.status !== 'paid'
  );

  // Paid orders for today's sales report
  const paidOrders = restaurantOrders.filter(o => o.status === 'paid');

  // Compute Consumed Items & Financials
  const itemsConsumed = useMemo(() => {
    const list: {
      key: string;
      name: string;
      quantity: number;
      finalUnitPrice: number;
      total: number;
      details?: string;
    }[] = [];

    tableActiveOrders.forEach(ord => {
      ord.items.forEach(item => {
        const customText = [
          item.selectedFlavors?.map(f => f.name).join(', '),
          item.quantitySelections
            ? Object.values(item.quantitySelections)
                .flat()
                .map(q => `${q.quantity}x ${q.name}`)
                .join(', ')
            : '',
        ]
          .filter(Boolean)
          .join(' | ');

        list.push({
          key: `${ord.id}_${item.cartItemId}`,
          name: item.name,
          quantity: item.quantity,
          finalUnitPrice: item.finalUnitPrice,
          total: item.finalUnitPrice * item.quantity,
          details: customText || undefined,
        });
      });
    });

    return list;
  }, [tableActiveOrders]);

  const subtotal = itemsConsumed.reduce((sum, i) => sum + i.total, 0);
  const serviceTaxAmount = includeServiceTax ? Number((subtotal * 0.1).toFixed(2)) : 0;
  const totalToPay = Math.max(0, Number((subtotal + serviceTaxAmount - discountAmount).toFixed(2)));

  // Cash change calculation
  const cashNum = parseFloat(cashReceived) || 0;
  const cashChange = paymentMethod === 'cash' && cashNum > totalToPay ? Number((cashNum - totalToPay).toFixed(2)) : 0;

  // Settle comanda
  const handleSettle = () => {
    if (!selectedTable || itemsConsumed.length === 0) return;

    settleTableBill(selectedTable.id, paymentMethod, serviceTaxAmount, discountAmount);

    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.5 },
    });

    setShowPaidSuccessToast(true);
    setTimeout(() => setShowPaidSuccessToast(false), 4000);
    setCashReceived('');
  };

  // Filtered tables for quick selector
  const filteredTables = restaurantTables.filter(t => {
    if (!searchTableQuery.trim()) return true;
    return (
      t.number.toString().includes(searchTableQuery.trim()) ||
      t.label.toLowerCase().includes(searchTableQuery.toLowerCase().trim())
    );
  });

  // Today KPI Metrics
  const totalRevenueToday = paidOrders.reduce((sum, o) => sum + o.total, 0);
  const averageTicket = paidOrders.length > 0 ? totalRevenueToday / paidOrders.length : 0;

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 p-3 sm:p-6 space-y-6">
      {/* Top Header */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-600 animate-pulse" />
            <h1 className="text-xl sm:text-2xl font-black text-neutral-900">
              Frente de Caixa (PDV & Fechamento de Mesas)
            </h1>
          </div>
          <p className="text-xs text-neutral-600 mt-0.5">
            {activeRestaurant.name} • Fechamento de comandas no balcão e conferência de maquininha
          </p>
        </div>

        {/* Quick Search Mesa */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-60">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTableQuery}
              onChange={e => setSearchTableQuery(e.target.value)}
              placeholder="Digitar nº da mesa..."
              className="w-full pl-9 pr-3 py-2 text-xs font-bold rounded-xl border border-neutral-300 bg-neutral-50 text-neutral-900 focus:outline-none focus:border-red-600"
            />
          </div>
        </div>
      </div>

      {/* Main Cashier Workspace: Left Table Picker & Right Table Comanda Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Table Status Grid (Col 1-4) */}
        <div className="lg:col-span-4 bg-white border border-neutral-200 rounded-2xl p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-2.5">
            <h2 className="font-black text-sm text-neutral-900">Selecione a Mesa</h2>
            <span className="text-xs text-neutral-500 font-bold">
              {restaurantTables.length} mesas cadastradas
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2 max-h-[520px] overflow-y-auto pr-1">
            {filteredTables.map(tbl => {
              const isSelected = tbl.id === selectedTableId;
              const hasBillRequested = tbl.status === 'bill_requested';
              const isOccupied = tbl.status === 'occupied';

              return (
                <button
                  key={tbl.id}
                  type="button"
                  onClick={() => setSelectedTableId(tbl.id)}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-neutral-900 text-white border-neutral-900 shadow-md scale-102'
                      : hasBillRequested
                      ? 'bg-red-50 border-red-500 text-neutral-900 animate-pulse'
                      : isOccupied
                      ? 'bg-amber-50/70 border-amber-300 text-neutral-900 hover:border-amber-400'
                      : 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:border-neutral-300 opacity-70'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm">{tbl.label}</span>
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        hasBillRequested
                          ? 'bg-red-600'
                          : isOccupied
                          ? 'bg-amber-500'
                          : 'bg-green-500'
                      }`}
                    />
                  </div>

                  <div className="text-[11px] font-bold">
                    {hasBillRequested ? (
                      <span className={isSelected ? 'text-red-300' : 'text-red-600 font-black'}>
                        Conta Solicitada!
                      </span>
                    ) : isOccupied ? (
                      <span className={isSelected ? 'text-amber-200' : 'text-amber-700'}>
                        {tbl.activeOrdersCount || 1} pedido(s)
                      </span>
                    ) : (
                      <span className={isSelected ? 'text-neutral-400' : 'text-green-700 font-semibold'}>
                        Livre
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Table Comanda & Payment Terminal (Col 5-12) */}
        <div className="lg:col-span-8 bg-white border border-neutral-200 rounded-2xl p-4 sm:p-6 space-y-5 shadow-xs">
          {/* Header of Selected Table */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-neutral-200 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-neutral-900 text-white flex items-center justify-center font-black text-lg shrink-0">
                {selectedTable?.number || '0'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-black text-lg sm:text-xl text-neutral-900">
                    Comanda • {selectedTable?.label || 'Mesa não selecionada'}
                  </h2>
                  <span
                    className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${
                      selectedTable?.status === 'bill_requested'
                        ? 'bg-red-50 text-red-700 border-red-300 animate-pulse'
                        : selectedTable?.status === 'occupied'
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : 'bg-green-50 text-green-700 border-green-300'
                    }`}
                  >
                    {selectedTable?.status === 'bill_requested'
                      ? 'Aguardando Pagamento'
                      : selectedTable?.status === 'occupied'
                      ? 'Consumindo no Salão'
                      : 'Mesa Disponível'}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {itemsConsumed.length} item(ns) consumido(s) nesta mesa
                </p>
              </div>
            </div>

            {/* Print receipt button */}
            <button
              type="button"
              onClick={() => window.print()}
              className="bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-neutral-700" />
              <span>Imprimir Conferência</span>
            </button>
          </div>

          {itemsConsumed.length === 0 ? (
            <div className="text-center py-12 text-neutral-500 space-y-2">
              <Receipt className="w-10 h-10 mx-auto text-neutral-400 opacity-60" />
              <p className="font-bold text-neutral-800">Nenhum consumo pendente para esta mesa.</p>
              <p className="text-xs">A mesa está liberada ou todos os pedidos já foram pagos.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Consumed Items List */}
              <div className="border border-neutral-200 rounded-xl overflow-hidden divide-y divide-neutral-100">
                <div className="bg-neutral-50 px-4 py-2 text-xs font-bold text-neutral-500 flex justify-between">
                  <span>Item Consumido</span>
                  <span>Total</span>
                </div>
                {itemsConsumed.map(item => (
                  <div key={item.key} className="p-3 sm:p-4 flex items-start justify-between gap-4 bg-white">
                    <div className="space-y-0.5">
                      <div className="font-bold text-sm text-neutral-900 flex items-center gap-2">
                        <span className="font-black text-neutral-800">{item.quantity}x</span>
                        <span>{item.name}</span>
                      </div>
                      {item.details && (
                        <p className="text-xs text-neutral-500 pl-6">{item.details}</p>
                      )}
                      <p className="text-[11px] text-neutral-400 pl-6">
                        R$ {item.finalUnitPrice.toFixed(2)} unitário
                      </p>
                    </div>
                    <span className="font-bold text-sm text-neutral-900 shrink-0">
                      R$ {item.total.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Adjustments: 10% Service Tax & Discount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-neutral-50 border border-neutral-200 rounded-xl p-3.5 text-xs">
                {/* 10% Service Tax */}
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeServiceTax}
                    onChange={e => setIncludeServiceTax(e.target.checked)}
                    className="w-4 h-4 text-red-600 rounded focus:ring-red-500 border-neutral-300"
                  />
                  <div>
                    <span className="font-bold text-neutral-900 block">
                      Taxa de Serviço 10% (Opcional)
                    </span>
                    <span className="text-[11px] text-neutral-500">
                      R$ {Number((subtotal * 0.1).toFixed(2))} para os garçons
                    </span>
                  </div>
                </label>

                {/* Discount */}
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-neutral-700">Desconto Especial (R$):</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={discountAmount || ''}
                    onChange={e => setDiscountAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                    placeholder="0.00"
                    className="w-24 px-2 py-1 text-right font-bold rounded-lg border border-neutral-300 bg-white text-neutral-900 focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>

              {/* Totals Summary */}
              <div className="border border-neutral-200 rounded-xl p-4 bg-neutral-50 space-y-2 text-sm">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal Consumido:</span>
                  <span className="font-bold text-neutral-900">R$ {subtotal.toFixed(2)}</span>
                </div>
                {includeServiceTax && (
                  <div className="flex justify-between text-neutral-600">
                    <span>Taxa de Serviço (10%):</span>
                    <span className="font-bold text-neutral-900">+R$ {serviceTaxAmount.toFixed(2)}</span>
                  </div>
                )}
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-700 font-bold">
                    <span>Desconto Aplicado:</span>
                    <span>-R$ {discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-black text-neutral-900 border-t border-neutral-200 pt-2">
                  <span>Total Final a Cobrar:</span>
                  <span className="text-red-600 text-xl">R$ {totalToPay.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2">
                <label className="font-bold text-xs text-neutral-700 uppercase tracking-wider block">
                  Forma de Pagamento no Caixa:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'pix', label: 'PIX (QR Code)', icon: QrCode },
                    { id: 'credit_card', label: 'Cartão Crédito', icon: CreditCard },
                    { id: 'debit_card', label: 'Cartão Débito', icon: CreditCard },
                    { id: 'cash', label: 'Dinheiro', icon: Banknote },
                  ].map(m => {
                    const Icon = m.icon;
                    const isSelected = paymentMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id as any)}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                            : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-400'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cash Change Calculator */}
              {paymentMethod === 'cash' && (
                <div className="bg-neutral-100 border border-neutral-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-neutral-800">Valor Recebido do Cliente:</span>
                    <input
                      type="number"
                      step="1"
                      value={cashReceived}
                      onChange={e => setCashReceived(e.target.value)}
                      placeholder={`R$ ${totalToPay.toFixed(2)}`}
                      className="w-28 px-2.5 py-1.5 font-black text-sm rounded-lg border border-neutral-300 bg-white text-neutral-900 focus:outline-none focus:border-red-600"
                    />
                  </div>
                  <div className="font-bold text-neutral-900">
                    Troco a devolver:{' '}
                    <span className="text-red-600 font-black text-base">
                      R$ {cashChange.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* PIX Helper */}
              {paymentMethod === 'pix' && (
                <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-xs flex items-center justify-between">
                  <span className="text-neutral-600">
                    Chave PIX da Loja:{' '}
                    <span className="font-mono font-bold text-neutral-900">
                      pix@{activeRestaurant.slug}.com.br
                    </span>
                  </span>
                  <span className="bg-green-100 text-green-800 font-bold px-2 py-0.5 rounded text-[11px]">
                    Recebimento Instantâneo
                  </span>
                </div>
              )}

              {/* Settle Action Button */}
              <button
                type="button"
                onClick={handleSettle}
                className="w-full bg-green-600 hover:bg-green-700 active:scale-98 text-white font-black py-4 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all text-base cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Confirmar Pagamento & Liberar Mesa • R$ {totalToPay.toFixed(2)}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Relatório de Comandas Finalizadas Hoje */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-neutral-200 pb-3">
          <div>
            <h3 className="font-black text-base text-neutral-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              Relatório de Comandas Finalizadas Hoje
            </h3>
            <p className="text-xs text-neutral-500">
              Vendas concluídas e mesas acertadas em tempo real
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="font-bold text-neutral-700">
              Total Faturado: <span className="text-green-700 font-black text-sm">R$ {totalRevenueToday.toFixed(2)}</span>
            </span>
            <span className="font-bold text-neutral-700">
              Ticket Médio: <span className="text-neutral-900 font-black">R$ {averageTicket.toFixed(2)}</span>
            </span>
          </div>
        </div>

        {paidOrders.length === 0 ? (
          <p className="text-xs text-neutral-500 text-center py-6">
            Nenhuma comanda finalizada hoje ainda.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-600 border-b border-neutral-200 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Pedido / Comanda</th>
                  <th className="py-2.5 px-3">Mesa / Local</th>
                  <th className="py-2.5 px-3">Horário</th>
                  <th className="py-2.5 px-3">Forma de Pagto</th>
                  <th className="py-2.5 px-3">Valor Total</th>
                  <th className="py-2.5 px-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {paidOrders.map(order => (
                  <tr key={order.id} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="py-3 px-3 font-bold text-neutral-900">
                      #{order.orderNumber}
                    </td>
                    <td className="py-3 px-3 font-semibold text-neutral-800">
                      {order.tableName}
                    </td>
                    <td className="py-3 px-3 text-neutral-500">
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-3">
                      <span className="bg-neutral-100 border border-neutral-200 text-neutral-800 font-bold px-2 py-0.5 rounded uppercase text-[10px]">
                        {order.paymentMethod || 'Caixa'}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-black text-green-700">
                      R$ {order.total.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="text-neutral-600 hover:text-black font-bold text-[11px] underline cursor-pointer"
                      >
                        Reimprimir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
