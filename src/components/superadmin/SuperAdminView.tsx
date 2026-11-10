import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  ShieldCheck,
  Plus,
  ArrowRight,
} from 'lucide-react';

export const SuperAdminView: React.FC = () => {
  const {
    restaurants,
    orders,
    tables,
    setActiveRestaurantId,
    setActiveViewMode,
    addRestaurant,
  } = useStore();

  const [showNewTenantModal, setShowNewTenantModal] = useState(false);
  const [tenantName, setTenantName] = useState('');
  const [tenantSlug, setTenantSlug] = useState('');
  const [tenantCategory, setTenantCategory] = useState('Pizzaria & Forneria');
  const [tenantPlan, setTenantPlan] = useState<'Starter' | 'Pro' | 'Enterprise'>('Pro');

  // Multi-tenant aggregate metrics
  const totalMrr = restaurants.reduce((acc, r) => acc + (r.monthlyFee || 0), 0);
  const totalNetworkGmv = orders.reduce((acc, o) => acc + o.total, 0);
  const totalTablesNetwork = tables.length;

  const handleCreateTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantName.trim()) return;

    const slug = tenantSlug.trim() || tenantName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const fee = tenantPlan === 'Enterprise' ? 349 : tenantPlan === 'Pro' ? 199 : 129;

    addRestaurant({
      name: tenantName.trim(),
      slug,
      category: tenantCategory,
      logo: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=200&h=200&q=80',
      banner: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&h=400&q=80',
      primaryColor: '#dc2626',
      accentColor: '#16a34a',
      description: `Cardápio Reels interativo de ${tenantName}.`,
      address: 'São Paulo - SP',
      phone: '(11) 99999-8888',
      tablesCount: 8,
      status: 'active',
      saasPlan: tenantPlan,
      monthlyFee: fee,
    });

    setShowNewTenantModal(false);
    setTenantName('');
    setTenantSlug('');
  };

  const handleEnterTenant = (restaurantId: string) => {
    setActiveRestaurantId(restaurantId);
    setActiveViewMode('merchant_admin');
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 p-3 sm:p-6 space-y-6">
      {/* Super Admin Header */}
      <div className="bg-white border border-neutral-200 rounded-3xl p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center text-white font-black text-xl shadow-xs">
            <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-neutral-900">
                Super Admin SaaS • Plataforma ReelsMenu
              </h1>
              <span className="text-xs bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-bold">
                Master
              </span>
            </div>
            <p className="text-xs text-neutral-600 mt-0.5">
              Gestão de todos os lojistas, faturamento recorrente (MRR) e volume transacionado
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowNewTenantModal(true)}
          className="bg-red-600 hover:bg-red-700 text-white font-black text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Novo Restaurante Lojista</span>
        </button>
      </div>

      {/* SaaS Network KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-xs">
          <span className="text-xs text-neutral-500 font-bold">MRR da Plataforma</span>
          <p className="text-2xl font-black text-neutral-900 mt-1">
            R$ {totalMrr.toFixed(2)}
            <span className="text-xs text-neutral-500 font-normal"> /mês</span>
          </p>
          <span className="text-[11px] text-green-700 font-bold mt-1 block">
            Planos de assinatura ativos
          </span>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-xs">
          <span className="text-xs text-neutral-500 font-bold">Lojas Cadastradas</span>
          <p className="text-2xl font-black text-neutral-900 mt-1">
            {restaurants.length} Lojas
          </p>
          <span className="text-[11px] text-neutral-500 font-semibold mt-1 block">
            Multi-tenant independente
          </span>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-xs">
          <span className="text-xs text-neutral-500 font-bold">Total de Mesas Conectadas</span>
          <p className="text-2xl font-black text-neutral-900 mt-1">
            {totalTablesNetwork} Mesas com QR Code
          </p>
          <span className="text-[11px] text-green-700 font-bold mt-1 block">
            Autoatendimento sem login
          </span>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-xs">
          <span className="text-xs text-neutral-500 font-bold">GMV Transacionado</span>
          <p className="text-2xl font-black text-neutral-900 mt-1">
            R$ {totalNetworkGmv.toFixed(2)}
          </p>
          <span className="text-[11px] text-neutral-500 font-semibold mt-1 block">
            Volume total de pedidos
          </span>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-neutral-200 flex items-center justify-between">
          <div>
            <h3 className="font-black text-base text-neutral-900">
              Restaurantes Lojistas Ativos no SaaS
            </h3>
            <p className="text-xs text-neutral-500">
              Cada lojista gerencia seu próprio cardápio, vídeos de Reels e mesas
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-neutral-500 uppercase tracking-wider text-[10px] border-b border-neutral-200">
              <tr>
                <th className="py-3 px-4">Restaurante</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Plano SaaS</th>
                <th className="py-3 px-4">Mensalidade</th>
                <th className="py-3 px-4">Mesas</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 font-medium">
              {restaurants.map(rest => {
                const restTablesCount = tables.filter(t => t.restaurantId === rest.id).length;
                return (
                  <tr key={rest.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={rest.logo}
                          alt=""
                          className="w-10 h-10 rounded-xl object-cover border border-neutral-200 shrink-0"
                        />
                        <div>
                          <div className="font-bold text-neutral-900 text-sm">{rest.name}</div>
                          <span className="text-[10px] text-neutral-500">slug: /{rest.slug}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-neutral-700">
                      {rest.category}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded-full border border-neutral-200">
                        {rest.saasPlan}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-neutral-900">
                      R$ {rest.monthlyFee?.toFixed(2)}/mês
                    </td>
                    <td className="py-3.5 px-4 text-neutral-700">
                      {restTablesCount} mesas
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        Ativo
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleEnterTenant(rest.id)}
                        className="bg-neutral-900 hover:bg-black text-white font-bold text-xs px-3 py-1.5 rounded-xl inline-flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <span>Entrar no Painel</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Tenant Modal */}
      {showNewTenantModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
        >
          <div className="bg-white border border-neutral-300 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-neutral-900">
            <h3 className="text-base font-black text-neutral-900">
              Cadastrar Novo Restaurante no SaaS
            </h3>
            <form onSubmit={handleCreateTenant} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-neutral-800">Nome do Estabelecimento *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Bar do Alemão, Cantina Bella"
                  value={tenantName}
                  onChange={e => setTenantName(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl p-2.5 text-neutral-900 focus:outline-none focus:border-red-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-neutral-800">Slug da URL (opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: bar-do-alemao"
                  value={tenantSlug}
                  onChange={e => setTenantSlug(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl p-2.5 text-neutral-900 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-neutral-800">Categoria</label>
                  <input
                    type="text"
                    value={tenantCategory}
                    onChange={e => setTenantCategory(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl p-2.5 text-neutral-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-neutral-800">Plano de Assinatura</label>
                  <select
                    value={tenantPlan}
                    onChange={e => setTenantPlan(e.target.value as any)}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl p-2.5 text-neutral-900"
                  >
                    <option value="Starter">Starter (R$ 129/mês)</option>
                    <option value="Pro">Pro (R$ 199/mês)</option>
                    <option value="Enterprise">Enterprise (R$ 349/mês)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setShowNewTenantModal(false)}
                  className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold py-2.5 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black py-2.5 rounded-xl cursor-pointer shadow-sm"
                >
                  Criar Estabelecimento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
