import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { OrderStatus } from '../../types';
import {
  Bell,
  CheckCircle,
  Clock,
  Flame,
  ChefHat,
  UserCheck,
  Volume2,
  VolumeX,
  CheckCircle2,
  Layers,
} from 'lucide-react';

export const WaiterView: React.FC = () => {
  const {
    activeRestaurant,
    tables,
    orders,
    updateOrderStatus,
    dismissWaiterCall,
  } = useStore();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTableFilter, setSelectedTableFilter] = useState<string>('all');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Play gentle web audio chime
  const playChime = () => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.45);
    } catch (e) {
      // AudioContext handled
    }
  };

  const restaurantOrders = orders.filter(o => o.restaurantId === activeRestaurant.id);
  const restaurantTables = tables.filter(t => t.restaurantId === activeRestaurant.id);

  const activeWaiterCalls = restaurantTables.filter(t => t.waiterCalled);

  const filteredOrders = restaurantOrders.filter(order => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesTable = selectedTableFilter === 'all' || order.tableId === selectedTableFilter;
    return matchesStatus && matchesTable;
  });

  const advanceOrderStatus = (orderId: string, currentStatus: OrderStatus) => {
    playChime();
    let nextStatus: OrderStatus = 'received';
    if (currentStatus === 'received') nextStatus = 'preparing';
    else if (currentStatus === 'preparing') nextStatus = 'ready';
    else if (currentStatus === 'ready') nextStatus = 'delivered';
    else if (currentStatus === 'delivered') nextStatus = 'paid';

    updateOrderStatus(orderId, nextStatus);
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 p-3 sm:p-6 space-y-6">
      {/* Waiter Top Bar */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-600 animate-pulse" />
            <h1 className="text-xl sm:text-2xl font-black text-neutral-900">
              Painel do Garçom & KDS de Mesa
            </h1>
          </div>
          <p className="text-xs text-neutral-600 mt-0.5">
            {activeRestaurant.name} • Sincronização em tempo real de status dos pedidos
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="bg-neutral-50 border border-neutral-300 hover:bg-neutral-100 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-green-600" />
                <span className="text-neutral-900">Alerta Sonoro Ativo</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-neutral-400" />
                <span className="text-neutral-500">Som Mudo</span>
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

      {/* Tables Status Quick Overview Bar */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-4 space-y-3 shadow-xs">
        <h2 className="text-xs font-black uppercase tracking-wider text-neutral-500">
          Mapa Rápido das Mesas
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {restaurantTables.map(tbl => {
            const isSelected = selectedTableFilter === tbl.id;
            return (
              <button
                key={tbl.id}
                type="button"
                onClick={() => setSelectedTableFilter(isSelected ? 'all' : tbl.id)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'ring-2 ring-red-600 border-red-600 bg-red-50'
                    : tbl.waiterCalled
                    ? 'border-red-500 bg-red-50'
                    : tbl.status === 'occupied'
                    ? 'border-green-300 bg-green-50/50'
                    : 'border-neutral-200 bg-neutral-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm text-neutral-900">Mesa {tbl.number}</span>
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      tbl.waiterCalled
                        ? 'bg-red-600 animate-ping'
                        : tbl.status === 'occupied'
                        ? 'bg-green-600'
                        : 'bg-neutral-300'
                    }`}
                  />
                </div>
                <div className="text-[10px] font-semibold text-neutral-600 mt-1 truncate">
                  {tbl.waiterCalled ? '🔔 Chamando' : tbl.status === 'occupied' ? 'Ocupada' : 'Livre'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters (Status & Table) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'all', label: 'Todos os Pedidos' },
            { id: 'received', label: '1. Novos (Na Fila)' },
            { id: 'preparing', label: '2. Em Preparo' },
            { id: 'ready', label: '3. Prontos para Entrega' },
            { id: 'delivered', label: '4. Entregues' },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`text-xs font-black px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'bg-white border border-neutral-300 text-neutral-700 hover:border-black'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {selectedTableFilter !== 'all' && (
          <button
            type="button"
            onClick={() => setSelectedTableFilter('all')}
            className="text-xs text-red-600 font-bold hover:underline cursor-pointer"
          >
            Limpar filtro de mesa
          </button>
        )}
      </div>

      {/* Orders KDS Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOrders.map(order => {
          const statusBg =
            order.status === 'received'
              ? 'border-neutral-300 bg-white'
              : order.status === 'preparing'
              ? 'border-red-400 bg-red-50/30'
              : order.status === 'ready'
              ? 'border-green-500 bg-green-50/40 shadow-sm'
              : order.status === 'delivered'
              ? 'border-neutral-200 bg-neutral-100 opacity-90'
              : 'border-neutral-200 bg-white';

          return (
            <div
              key={order.id}
              className={`border-2 rounded-2xl p-4 flex flex-col justify-between transition-all shadow-xs ${statusBg}`}
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-neutral-900">
                        #{order.orderNumber}
                      </span>
                      <span className="text-xs font-bold text-white bg-neutral-900 px-2 py-0.5 rounded-md">
                        {order.tableName}
                      </span>
                    </div>
                    <span className="text-[11px] text-neutral-500 font-semibold flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3 text-neutral-400" />
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <span
                    className={`text-xs font-black px-2.5 py-1 rounded-full uppercase border ${
                      order.status === 'received'
                        ? 'bg-neutral-100 text-neutral-800 border-neutral-300'
                        : order.status === 'preparing'
                        ? 'bg-red-50 text-red-700 border-red-300 animate-pulse'
                        : order.status === 'ready'
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-neutral-200 text-neutral-700 border-neutral-300'
                    }`}
                  >
                    {order.status === 'received' && 'Novo Pedido'}
                    {order.status === 'preparing' && 'Preparando'}
                    {order.status === 'ready' && 'Pronto!'}
                    {order.status === 'delivered' && 'Entregue'}
                    {order.status === 'paid' && 'Conta Paga'}
                  </span>
                </div>

                {/* Items */}
                <div className="space-y-2 py-2 border-y border-neutral-200">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="text-xs">
                      <div className="flex justify-between font-black text-neutral-900">
                        <span>
                          <span className="text-red-600 font-extrabold">{item.quantity}x</span> {item.name}
                        </span>
                        <span>R$ {(item.finalUnitPrice * item.quantity).toFixed(2)}</span>
                      </div>
                      {item.selectedFlavors && item.selectedFlavors.length > 0 && (
                        <div className="bg-white border border-neutral-200 p-1.5 rounded-lg text-[11px] text-red-600 font-bold mt-1">
                          Sabores: {item.selectedFlavors.map(f => f.name).join(' • ')}
                        </div>
                      )}
                      {item.selectedAddons && item.selectedAddons.length > 0 && (
                        <div className="text-[11px] text-neutral-600 ml-3">
                          + {item.selectedAddons.map(a => a.name).join(', ')}
                        </div>
                      )}
                      {item.customSelections && Object.keys(item.customSelections).length > 0 && (
                        <div className="text-[11px] text-neutral-600 ml-3">
                          {Object.values(item.customSelections).flat().map((sel, i) => (
                            <span key={i} className="inline-block mr-1 text-neutral-700 font-semibold">
                              • {sel.name}
                            </span>
                          ))}
                        </div>
                      )}
                      {item.notes && (
                        <div className="text-[11px] text-red-700 font-bold italic ml-3 mt-0.5">
                          Obs: {item.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {order.notes && (
                  <p className="text-xs text-red-700 bg-red-50 p-2 rounded-lg border border-red-200 font-bold">
                    Nota da mesa: {order.notes}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-neutral-200 flex items-center justify-between gap-2">
                <span className="text-sm font-black text-neutral-900">
                  Total: R$ {order.total.toFixed(2)}
                </span>

                {order.status === 'received' && (
                  <button
                    type="button"
                    onClick={() => advanceOrderStatus(order.id, 'received')}
                    className="bg-neutral-900 hover:bg-black text-white font-black text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                  >
                    <Flame className="w-3.5 h-3.5 text-red-500" />
                    <span>Iniciar Preparo</span>
                  </button>
                )}

                {order.status === 'preparing' && (
                  <button
                    type="button"
                    onClick={() => advanceOrderStatus(order.id, 'preparing')}
                    className="bg-green-600 hover:bg-green-700 text-white font-black text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Pronto para Servir!</span>
                  </button>
                )}

                {order.status === 'ready' && (
                  <button
                    type="button"
                    onClick={() => advanceOrderStatus(order.id, 'ready')}
                    className="bg-red-600 hover:bg-red-700 text-white font-black text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-xs"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Confirmar Entrega</span>
                  </button>
                )}

                {order.status === 'delivered' && (
                  <span className="text-xs text-green-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> Servido na mesa
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {filteredOrders.length === 0 && (
          <div className="col-span-full py-16 text-center text-neutral-500 bg-white border border-neutral-200 rounded-2xl">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
            <p className="font-black text-neutral-900">Nenhum pedido neste filtro.</p>
            <p className="text-xs mt-1">Todos os pedidos estão em dia!</p>
          </div>
        )}
      </div>
    </div>
  );
};
