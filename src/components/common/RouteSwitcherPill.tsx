import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { AppViewMode } from '../../types';
import {
  Smartphone,
  ChefHat,
  Store,
  ShieldCheck,
  CreditCard,
  Layers,
  ChevronUp,
  X,
  ExternalLink,
} from 'lucide-react';

interface RouteOption {
  id: AppViewMode;
  path: string;
  label: string;
  icon: any;
  desc: string;
}

export const RouteSwitcherPill: React.FC = () => {
  const { activeViewMode, setActiveViewMode, activeRestaurant } = useStore();
  const [isOpen, setIsOpen] = useState(false);

  const routes: RouteOption[] = [
    {
      id: 'customer',
      path: '/',
      label: 'Cliente na Mesa',
      icon: Smartphone,
      desc: 'Reels, Cardápio e Carrinho sem login',
    },
    {
      id: 'waiter',
      path: '/garcom',
      label: 'Garçom & KDS Cozinha',
      icon: ChefHat,
      desc: 'Kanban em tempo real e impressão',
    },
    {
      id: 'cashier',
      path: '/caixa',
      label: 'Frente de Caixa (PDV)',
      icon: CreditCard,
      desc: 'Fechamento de comandas e relatório',
    },
    {
      id: 'merchant_admin',
      path: '/lojista',
      label: 'Painel do Lojista',
      icon: Store,
      desc: 'Gestão de cardápio, métricas e estoque',
    },
    {
      id: 'super_admin',
      path: '/superadmin',
      label: 'Super Admin SaaS',
      icon: ShieldCheck,
      desc: 'Gestão da rede e lojistas assinantes',
    },
  ];

  const handleNavigate = (route: RouteOption) => {
    setActiveViewMode(route.id);
    try {
      window.history.pushState({}, '', route.path);
    } catch {}
    setIsOpen(false);
  };

  const currentRoute = routes.find(r => r.id === activeViewMode) || routes[0];
  const CurrentIcon = currentRoute.icon;

  return (
    <div className="fixed bottom-3 right-3 z-50 font-['Plus_Jakarta_Sans',sans-serif]">
      {isOpen && (
        <div className="mb-2 bg-white/95 backdrop-blur-md border border-neutral-300 rounded-2xl p-3 shadow-2xl w-72 animate-in fade-in slide-in-from-bottom-2 duration-150 text-neutral-900">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-200">
            <span className="font-black text-xs text-neutral-900 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-red-600" />
              Rotas do Sistema SaaS
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-500 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1">
            {routes.map(r => {
              const Icon = r.icon;
              const isCurrent = activeViewMode === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleNavigate(r)}
                  className={`w-full text-left p-2 rounded-xl border flex items-start gap-2.5 transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                      : 'bg-neutral-50 border-neutral-200 hover:border-neutral-400 text-neutral-800'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${isCurrent ? 'text-red-400' : 'text-neutral-600'}`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">{r.label}</span>
                      <span className={`text-[10px] font-mono ${isCurrent ? 'text-neutral-400' : 'text-neutral-500'}`}>
                        {r.path}
                      </span>
                    </div>
                    <p className={`text-[10px] leading-tight mt-0.5 ${isCurrent ? 'text-neutral-300' : 'text-neutral-500'}`}>
                      {r.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-2.5 pt-2 border-t border-neutral-200 text-[10px] text-neutral-500 text-center">
            Loja ativa: <span className="font-bold text-neutral-800">{activeRestaurant.name}</span>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Alternar rota do sistema"
        className="bg-neutral-900/90 hover:bg-black text-white text-xs font-bold px-3 py-2 rounded-full shadow-lg border border-neutral-700 flex items-center gap-2 backdrop-blur-sm transition-all active:scale-95 cursor-pointer"
      >
        <CurrentIcon className="w-3.5 h-3.5 text-red-400" />
        <span className="hidden sm:inline font-mono text-[11px]">{currentRoute.path}</span>
        <ChevronUp className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
    </div>
  );
};
