import React from 'react';
import { useStore } from '../../context/StoreContext';
import { AppViewMode } from '../../types';
import {
  Smartphone,
  ChefHat,
  Store,
  ShieldCheck,
  Volume2,
  VolumeX,
} from 'lucide-react';

export const HeaderNavigation: React.FC = () => {
  const {
    activeViewMode,
    setActiveViewMode,
    restaurants,
    activeRestaurant,
    setActiveRestaurantId,
    activeTable,
    pushSoundEnabled,
    setPushSoundEnabled,
  } = useStore();

  const modes: { id: AppViewMode; label: string; icon: any; badge?: string }[] = [
    { id: 'customer', label: 'Cliente na Mesa', icon: Smartphone, badge: activeTable?.label },
    { id: 'waiter', label: 'Tela do Garçom', icon: ChefHat, badge: 'Tempo Real' },
    { id: 'merchant_admin', label: 'Painel do Lojista', icon: Store },
    { id: 'super_admin', label: 'Super Admin SaaS', icon: ShieldCheck, badge: 'Rede' },
  ];

  return (
    <div className="shrink-0 bg-white border-b border-neutral-200 text-neutral-900 shadow-sm">
      {/* Role Switcher Toolbar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Multi-tenant Store Selector */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-600 animate-pulse" />
            <span className="font-black text-base tracking-tight text-neutral-900 flex items-center gap-1.5">
              ReelsMenu
              <span className="text-[10px] bg-red-50 text-red-700 font-extrabold px-2 py-0.5 rounded-md border border-red-200 uppercase">
                SaaS
              </span>
            </span>
          </div>

          {/* Tenant Switcher dropdown */}
          <div className="flex items-center gap-2 bg-neutral-100 border border-neutral-300 rounded-xl px-2.5 py-1 text-xs">
            <span className="text-neutral-500 font-medium text-[11px] hidden sm:inline">Loja:</span>
            <select
              value={activeRestaurant.id}
              onChange={e => setActiveRestaurantId(e.target.value)}
              className="bg-transparent text-neutral-900 font-bold focus:outline-none cursor-pointer text-xs"
            >
              {restaurants.map(r => (
                <option key={r.id} value={r.id} className="bg-white text-neutral-900">
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Mode Selector Tabs & Sound toggle */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-center overflow-x-auto pb-1 md:pb-0 no-scrollbar">
          <div className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-2xl border border-neutral-200">
            {modes.map(mode => {
              const Icon = mode.icon;
              const isActive = activeViewMode === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setActiveViewMode(mode.id)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-neutral-700 hover:text-black hover:bg-neutral-200/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{mode.label}</span>
                  {mode.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${
                        isActive ? 'bg-white/20 text-white' : 'bg-neutral-200 text-neutral-700'
                      }`}
                    >
                      {mode.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Real-time Chime Sound Toggle */}
          <button
            type="button"
            onClick={() => setPushSoundEnabled(!pushSoundEnabled)}
            title={pushSoundEnabled ? 'Som de notificações ativado' : 'Som de notificações desativado'}
            className={`p-2 rounded-xl border transition-colors ${
              pushSoundEnabled
                ? 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100'
                : 'bg-neutral-100 border-neutral-300 text-neutral-400 hover:text-neutral-700'
            }`}
          >
            {pushSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
