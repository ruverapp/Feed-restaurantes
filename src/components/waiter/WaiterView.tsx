import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Order, OrderStatus } from '../../types';
import { OrderDetailModal } from './OrderDetailModal';
import {
  Bell,
  Clock,
  ChefHat,
  CheckCircle2,
  Utensils,
  Volume2,
  VolumeX,
  Eye,
  Filter,
  Layers,
  ArrowRight,
} from 'lucide-react';

export const WaiterView: React.FC = () => {
  const {
    activeRestaurant,
    tables,
    orders,
    updateOrderStatus,
    dismissWaiterCall,
  } = useStore();

  const [selectedTableFilter, setSelectedTableFilter] = useState<string>('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<Order | null>(null);

  const playChime = () => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch {}
  };

  const restaurantOrders = orders.filter(o => o.restaurantId === activeRestaurant.id);
  const restaurantTables = tables.filter(t => t.restaurantId === activeRestaurant.id);

  const activeWaiterCalls = restaurantTables.filter(t => t.waiterCalled);

  const filteredOrders = restaurantOrders.filter(order => {
    const matchesTable = selectedTableFilter === 'all' || order.tableId === selectedTableFilter;
    return matchesTable;
  });

  // Kanban Columns
  const newOrders = filteredOrders.filter(o => o.status === 'received');
  const preparingOrders = filteredOrders.filter(o => o.status === 'preparing');
  const readyOrders = filteredOrders.filter(o => o.status === 'ready');
  const deliveredOrders = filteredOrders.filter(o => o.status === 'delivered');

  const advanceOrderStatus = (orderId: string, currentStatus: OrderStatus) => {
    playChime();
    let nextStatus: OrderStatus = 'received';
    if (currentStatus === 'received') nextStatus = 'preparing';
    else if (currentStatus === 'preparing') nextStatus = 'ready';
    else if (currentStatus === 'ready') nextStatus = 'delivered';
    else if (currentStatus === 'delivered') nextStatus = 'paid';

    updateOrderStatus(orderId, nextStatus);

    if (selectedOrderForModal && selectedOrderForModal.id === orderId) {
      setSelectedOrderForModal(prev => (prev ? { ...prev, status: nextStatus } : null));
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 p-3 sm:p-6 space-y-6">
      {/* Waiter Top Bar */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-600 animate-pulse" />
            <h1 className="text-xl sm:text-2xl font-black text-neutral-900">
              Painel do Garçom & KDS Cozinha
            </h1>
          </div>
          <p className="text-xs text-neutral-600 mt-0.5">
            {activeRestaurant.name} • Sincronização em tempo real de status dos pedidos
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Table filter */}
          <select
            value={selectedTableFilter}
            onChange={e => setSelectedTableFilter(e.target.value)}
            className="bg-neutral-50 border border-neutral-300 text-xs font-bold px-3 py-2 rounded-xl text-neutral-800 focus:outline-none focus:border-red-600 cursor-pointer"
          >
            <option value="all">Todas as Mesas</option>
            {restaurantTables.map(t => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="bg-neutral-50 border border-neutral-300 hover:bg-neutral-100 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-green-600" />
                <span className="hidden sm:inline text-neutral-900">Som Ativo</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-neutral-400" />
                <span className="hidden sm:inline text-neutral-500">Mudo</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Active Waiter Calls Urgent Banner */}
      {activeWaiterCalls.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-red-600">
            <Bell className="w-4 h-4 animate-bounce" />
            <span>Chamados de Mesas Urgentes ({activeWaiterCalls.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeWaiterCalls.map(tbl => (
              <div
                key={tbl.id}
                className="bg-red-50 border-2 border-red-500 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs animate-in fade-in"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-neutral-900 text-base">
                      {tbl.label}
                    </span>
                    {tbl.status === 'bill_requested' && (
                      <span className="text-[10px] bg-red-600 text-white font-black px-1.5 py-0.5 rounded uppercase">
                        Conta
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-red-700 font-bold mt-1">
                    Motivo: {tbl.waiterCallReason || 'Atendimento solicitado'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => dismissWaiterCall(tbl.id)}
                  className="bg-red-600 hover:bg-red-700 text-white font-black text-xs px-3.5 py-2 rounded-xl shrink-0 transition-colors cursor-pointer shadow-xs"
                >
                  Atendido ✓
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Kanban Board (4 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        {/* Column 1: Novos Pedidos */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-4 flex flex-col min-h-[500px] shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-neutral-900" />
              <h2 className="font-black text-sm text-neutral-900">1. Novos Pedidos</h2>
            </div>
            <span className="text-xs font-black px-2 py-0.5 rounded-full bg-neutral-900 text-white">
              {newOrders.length}
            </span>
          </div>

          <div className="mt-3 space-y-3 flex-1 overflow-y-auto">
            {newOrders.length === 0 ? (
              <p className="text-xs text-neutral-400 text-center py-8">Nenhum pedido novo</p>
            ) : (
              newOrders.map(order => (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrderForModal(order)}
                  className="bg-neutral-50 hover:bg-neutral-100/80 border border-neutral-200 rounded-xl p-3.5 space-y-2.5 transition-all shadow-xs cursor-pointer hover:border-neutral-400"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-neutral-900">
                      #{order.orderNumber} • {order.tableName}
                    </span>
                    <span className="text-[10px] text-neutral-500 font-mono">
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-700 font-medium line-clamp-2">
                    {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                  </p>

                  {order.notes && (
                    <p className="text-[11px] text-red-600 font-bold bg-red-50 p-1.5 rounded border border-red-200 line-clamp-1">
                      Obs: {order.notes}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-neutral-200">
                    <span className="font-black text-xs text-neutral-900">
                      R$ {order.total.toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        advanceOrderStatus(order.id, 'received');
                      }}
                      className="bg-neutral-900 hover:bg-black text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <span>Preparar</span>
                      <ArrowRight className="w-3 h-3 text-red-400" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 2: Em Preparo */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-4 flex flex-col min-h-[500px] shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
              <h2 className="font-black text-sm text-neutral-900">2. Em Preparo</h2>
            </div>
            <span className="text-xs font-black px-2 py-0.5 rounded-full bg-red-600 text-white">
              {preparingOrders.length}
            </span>
          </div>

          <div className="mt-3 space-y-3 flex-1 overflow-y-auto">
            {preparingOrders.length === 0 ? (
              <p className="text-xs text-neutral-400 text-center py-8">Cozinha liberada</p>
            ) : (
              preparingOrders.map(order => (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrderForModal(order)}
                  className="bg-red-50/50 hover:bg-red-50 border border-red-300 rounded-xl p-3.5 space-y-2.5 transition-all shadow-xs cursor-pointer hover:border-red-500"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-neutral-900">
                      #{order.orderNumber} • {order.tableName}
                    </span>
                    <span className="text-[10px] text-red-600 font-bold bg-white px-1.5 py-0.5 rounded border border-red-200">
                      No Fogão
                    </span>
                  </div>

                  <p className="text-xs text-neutral-800 font-medium line-clamp-2">
                    {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                  </p>

                  {order.notes && (
                    <p className="text-[11px] text-red-700 font-bold bg-white p-1.5 rounded border border-red-200 line-clamp-1">
                      Obs: {order.notes}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-red-200">
                    <span className="font-black text-xs text-neutral-900">
                      R$ {order.total.toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        advanceOrderStatus(order.id, 'preparing');
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer shadow-xs"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Pronto!</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 3: Prontos para Retirada / Servir */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-4 flex flex-col min-h-[500px] shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-600" />
              <h2 className="font-black text-sm text-neutral-900">3. Prontos para Servir</h2>
            </div>
            <span className="text-xs font-black px-2 py-0.5 rounded-full bg-green-600 text-white">
              {readyOrders.length}
            </span>
          </div>

          <div className="mt-3 space-y-3 flex-1 overflow-y-auto">
            {readyOrders.length === 0 ? (
              <p className="text-xs text-neutral-400 text-center py-8">Nenhum prato aguardando</p>
            ) : (
              readyOrders.map(order => (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrderForModal(order)}
                  className="bg-green-50/70 hover:bg-green-50 border border-green-300 rounded-xl p-3.5 space-y-2.5 transition-all shadow-xs cursor-pointer hover:border-green-500 animate-pulse"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-neutral-900">
                      #{order.orderNumber} • {order.tableName}
                    </span>
                    <span className="text-[10px] text-green-700 font-extrabold bg-white px-1.5 py-0.5 rounded border border-green-200">
                      Pronto
                    </span>
                  </div>

                  <p className="text-xs text-neutral-800 font-medium line-clamp-2">
                    {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-green-200">
                    <span className="font-black text-xs text-neutral-900">
                      R$ {order.total.toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        advanceOrderStatus(order.id, 'ready');
                      }}
                      className="bg-neutral-900 hover:bg-black text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <Utensils className="w-3 h-3 text-green-400" />
                      <span>Entregue</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 4: Entregues na Mesa */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-4 flex flex-col min-h-[500px] shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-neutral-400" />
              <h2 className="font-black text-sm text-neutral-900">4. Entregues</h2>
            </div>
            <span className="text-xs font-black px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-700">
              {deliveredOrders.length}
            </span>
          </div>

          <div className="mt-3 space-y-3 flex-1 overflow-y-auto">
            {deliveredOrders.length === 0 ? (
              <p className="text-xs text-neutral-400 text-center py-8">Nenhum pedido entregue</p>
            ) : (
              deliveredOrders.map(order => (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrderForModal(order)}
                  className="bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-xl p-3.5 space-y-2.5 transition-all shadow-xs cursor-pointer opacity-85 hover:opacity-100"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-neutral-800">
                      #{order.orderNumber} • {order.tableName}
                    </span>
                    <span className="text-[10px] text-neutral-500">
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-600 line-clamp-1">
                    {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-neutral-200">
                    <span className="font-bold text-xs text-neutral-700">
                      R$ {order.total.toFixed(2)}
                    </span>
                    <span className="text-[11px] font-bold text-green-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                      Entregue
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Order Detail Modal (Opened upon card click, matching attachment layout) */}
      {selectedOrderForModal && (
        <OrderDetailModal
          order={selectedOrderForModal}
          restaurantName={activeRestaurant.name}
          onClose={() => setSelectedOrderForModal(null)}
          onUpdateStatus={advanceOrderStatus}
        />
      )}
    </div>
  );
};
