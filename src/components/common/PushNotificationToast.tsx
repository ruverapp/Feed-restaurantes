import React from 'react';
import { useStore } from '../../context/StoreContext';
import { Bell, CheckCircle2, Flame, UtensilsCrossed, X, Star } from 'lucide-react';

export const PushNotificationToast: React.FC = () => {
  const { activePushToast, dismissPushToast } = useStore();

  if (!activePushToast) return null;

  const isGreen = activePushToast.status === 'ready' || activePushToast.status === 'delivered';
  const isRed = activePushToast.status === 'received' || activePushToast.status === 'preparing';

  return (
    <aside
      aria-label="Notificação do sistema"
      className="fixed top-4 right-4 left-4 sm:left-auto sm:w-96 z-50 animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto"
    >
      <div
        className={`bg-white rounded-2xl p-4 shadow-2xl border-2 flex items-start gap-3.5 transition-all ${
          isGreen
            ? 'border-green-600 shadow-green-600/15'
            : isRed
            ? 'border-red-600 shadow-red-600/15'
            : 'border-neutral-900 shadow-neutral-900/15'
        }`}
      >
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isGreen
              ? 'bg-green-100 text-green-700'
              : isRed
              ? 'bg-red-100 text-red-700'
              : 'bg-neutral-100 text-neutral-900'
          }`}
        >
          {activePushToast.status === 'ready' && <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />}
          {activePushToast.status === 'preparing' && <Flame className="w-5 h-5 stroke-[2.5]" />}
          {activePushToast.status === 'delivered' && <UtensilsCrossed className="w-5 h-5 stroke-[2.5]" />}
          {activePushToast.type === 'review_received' && <Star className="w-5 h-5 stroke-[2.5] fill-green-500 text-green-500" />}
          {activePushToast.type === 'waiter_alert' && <Bell className="w-5 h-5 stroke-[2.5]" />}
          {!activePushToast.status && activePushToast.type === 'order_status' && <Bell className="w-5 h-5 stroke-[2.5]" />}
        </div>

        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-extrabold text-sm text-neutral-900 leading-tight">
              {activePushToast.title}
            </h4>
            <span className="text-[10px] font-mono text-neutral-400 shrink-0">
              {new Date(activePushToast.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <p className="text-xs text-neutral-600 mt-1 leading-snug">
            {activePushToast.message}
          </p>

          {activePushToast.tableName && (
            <span className="inline-block mt-1.5 text-[10px] font-bold bg-neutral-100 text-neutral-800 px-2 py-0.5 rounded-full border border-neutral-200">
              {activePushToast.tableName}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={dismissPushToast}
          aria-label="Fechar notificação"
          className="text-neutral-400 hover:text-neutral-900 p-1 -mr-1 -mt-1 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
