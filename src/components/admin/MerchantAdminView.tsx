import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product, Table } from '../../types';
import { calculateDwellPerformance, calculateReviewsSummary } from '../../utils/pricing';
import { ProductEditModal } from './ProductEditModal';
import { TableQrModal } from './TableQrModal';
import {
  TrendingUp,
  Clock,
  UtensilsCrossed,
  QrCode,
  Tag,
  Truck,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Star,
  Sparkles,
  Layers,
  ThumbsUp,
  MessageSquare,
  AlertTriangle,
} from 'lucide-react';

export const MerchantAdminView: React.FC = () => {
  const {
    activeRestaurant,
    products,
    tables,
    orders,
    coupons,
    deliveryZones,
    dwellMetrics,
    reviews,
    addProduct,
    updateProduct,
    deleteProduct,
    addTable,
    deleteTable,
    addCoupon,
    toggleCouponActive,
    deleteCoupon,
    setActiveTableId,
    setActiveViewMode,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'dwell' | 'sales' | 'products' | 'reviews' | 'tables' | 'coupons'>('dwell');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [selectedTableForQr, setSelectedTableForQr] = useState<Table | null>(null);

  // New Table inputs
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableLabel, setNewTableLabel] = useState('');

  // New Coupon inputs
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponType, setNewCouponType] = useState<'percentage' | 'fixed'>('percentage');
  const [newCouponValue, setNewCouponValue] = useState('');
  const [newCouponMinOrder, setNewCouponMinOrder] = useState('');

  // Filter items for this merchant
  const restaurantProducts = products.filter(p => p.restaurantId === activeRestaurant.id);
  const restaurantTables = tables.filter(t => t.restaurantId === activeRestaurant.id);
  const restaurantOrders = orders.filter(o => o.restaurantId === activeRestaurant.id);
  const restaurantCoupons = coupons.filter(c => c.restaurantId === activeRestaurant.id);
  const restaurantZones = deliveryZones.filter(z => z.restaurantId === activeRestaurant.id);
  const restaurantReviews = reviews.filter(r => r.restaurantId === activeRestaurant.id);

  // Reviews Summary calculations
  const reviewsSummary = calculateReviewsSummary(restaurantReviews);

  // Sales KPIs
  const todayTotalRevenue = restaurantOrders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0);
  const totalOrdersCount = restaurantOrders.length;
  const averageTicket = totalOrdersCount > 0 ? todayTotalRevenue / totalOrdersCount : 0;
  const occupiedTablesCount = restaurantTables.filter(t => t.status === 'occupied' || t.status === 'bill_requested').length;

  // Dwell Metrics calculations
  const dwellList = restaurantProducts.map(prod => {
    const rawMetric = dwellMetrics[prod.id] || {
      productId: prod.id,
      restaurantId: activeRestaurant.id,
      totalViewDurationSec: 0,
      impressionCount: 0,
      orderCount: 0,
      lastViewedAt: '',
    };
    const perf = calculateDwellPerformance(rawMetric);
    return {
      product: prod,
      ...perf,
    };
  }).sort((a, b) => b.totalViewDurationSec - a.totalViewDurationSec);

  // Dish Reviews ranking
  const dishReviewsRanking = restaurantProducts.map(prod => {
    const dishRevs = restaurantReviews.filter(r => r.productId === prod.id);
    const avg = dishRevs.length > 0
      ? Number((dishRevs.reduce((acc, r) => acc + r.rating, 0) / dishRevs.length).toFixed(1))
      : (prod.averageRating || 5.0);
    return {
      product: prod,
      reviewsCount: dishRevs.length,
      averageRating: avg,
      recentComments: dishRevs.slice(0, 2),
    };
  }).sort((a, b) => b.averageRating - a.averageRating);

  const handleCreateNewTable = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(newTableNumber, 10);
    if (!num) return;
    const label = newTableLabel.trim() || `Mesa ${num}`;
    addTable(num, label);
    setNewTableNumber('');
    setNewTableLabel('');
  };

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode.trim() || !newCouponValue) return;
    addCoupon({
      restaurantId: activeRestaurant.id,
      code: newCouponCode.trim().toUpperCase(),
      discountType: newCouponType,
      discountValue: parseFloat(newCouponValue) || 0,
      minOrderValue: parseFloat(newCouponMinOrder) || 0,
      active: true,
    });
    setNewCouponCode('');
    setNewCouponValue('');
    setNewCouponMinOrder('');
  };

  const handleSimulateTable = (tableId: string) => {
    setActiveTableId(tableId);
    setActiveViewMode('customer');
    setSelectedTableForQr(null);
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 p-3 sm:p-6 space-y-6">
      {/* Merchant Header */}
      <div className="bg-white border border-neutral-200 rounded-3xl p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <img
            src={activeRestaurant.logo}
            alt=""
            className="w-12 h-12 rounded-2xl object-cover border-2 border-red-600 shadow-xs"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-neutral-900">
                Painel do Lojista: {activeRestaurant.name}
              </h1>
              <span className="text-xs bg-red-50 text-red-700 font-bold px-2.5 py-0.5 rounded-full border border-red-200">
                Plano {activeRestaurant.saasPlan}
              </span>
            </div>
            <p className="text-xs text-neutral-600 mt-0.5">
              Gestão de cardápio Reels, métricas de tempo de tela, QR codes e comandas
            </p>
          </div>
        </div>

        {/* Quick Tabs Navigation */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 no-scrollbar">
          {[
            { id: 'dwell', label: '⏱️ Métricas Reels' },
            { id: 'sales', label: '📊 Vendas Hoje' },
            { id: 'products', label: '🍕 Cardápio & Itens' },
            { id: 'reviews', label: '⭐ Avaliações & Feedback' },
            { id: 'tables', label: '🪑 Mesas & QR Code' },
            { id: 'coupons', label: '🎟️ Cupons & Taxas' },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`text-xs font-black px-3.5 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'bg-white border border-neutral-300 text-neutral-700 hover:border-black'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: DWELL TIME & REELS FEED METRICS */}
      {activeTab === 'dwell' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white border border-neutral-200 rounded-3xl p-5 space-y-2 shadow-xs">
            <div className="flex items-center gap-2 text-red-600 font-black text-sm uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Inteligência de Cardápio Reels (Dwell-Time Analytics)</span>
            </div>
            <p className="text-xs text-neutral-600 max-w-2xl leading-relaxed">
              Descubra <strong>quanto tempo cada cliente passa olhando</strong> os vídeos e fotos dos seus pratos no feed da mesa e qual a taxa de conversão em pedidos reais.
            </p>
          </div>

          {/* Dwell Metrics Table */}
          <div className="bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-xs">
            <div className="p-4 sm:p-5 border-b border-neutral-200 flex items-center justify-between">
              <div>
                <h3 className="font-black text-base text-neutral-900">
                  Ranking de Engajamento do Feed Reels
                </h3>
                <p className="text-xs text-neutral-500">
                  Pratos ordenados por tempo total de tela acumulado
                </p>
              </div>
              <span className="text-xs font-bold text-neutral-800 bg-neutral-100 px-3 py-1 rounded-full border border-neutral-200">
                {dwellList.length} pratos monitorados
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 text-neutral-500 uppercase tracking-wider text-[10px] border-b border-neutral-200">
                  <tr>
                    <th className="py-3 px-4">Prato / Item</th>
                    <th className="py-3 px-4">Mídia</th>
                    <th className="py-3 px-4">Tempo Total Vendo</th>
                    <th className="py-3 px-4">Tempo Médio p/ Cliente</th>
                    <th className="py-3 px-4">Visualizações</th>
                    <th className="py-3 px-4">Pedidos Feitos</th>
                    <th className="py-3 px-4">Taxa de Conversão</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 font-medium">
                  {dwellList.map(({ product, totalViewDurationSec, impressionCount, orderCount, avgDwellTimeSec, conversionRatePercent }) => {
                    const minutes = Math.floor(totalViewDurationSec / 60);
                    const seconds = totalViewDurationSec % 60;
                    return (
                      <tr key={product.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={product.videoPoster || product.mediaUrl}
                              alt=""
                              className="w-10 h-10 rounded-xl object-cover bg-neutral-100 shrink-0 border border-neutral-200"
                            />
                            <div>
                              <div className="font-bold text-neutral-900 text-sm">{product.name}</div>
                              <span className="text-[10px] text-red-600 font-bold">{product.category}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            product.mediaType === 'video'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-neutral-100 text-neutral-800'
                          }`}>
                            {product.mediaType === 'video' ? '🎬 Vídeo Reel' : '📷 Foto'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-neutral-900">
                          {minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-neutral-900 bg-neutral-100 px-2 py-1 rounded-md">
                            ~{avgDwellTimeSec} seg
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-neutral-700">
                          {impressionCount} clientes
                        </td>
                        <td className="py-3.5 px-4 font-bold text-green-700">
                          {orderCount} pedidos
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-neutral-200 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-red-600 h-full rounded-full"
                                style={{ width: `${Math.min(100, conversionRatePercent)}%` }}
                              />
                            </div>
                            <span className="font-black text-neutral-900 text-xs">
                              {conversionRatePercent}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DAILY SALES & REAL-TIME PERFORMANCE */}
      {activeTab === 'sales' && (
        <div className="space-y-6 animate-in fade-in">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-xs">
              <span className="text-xs text-neutral-500 font-bold">Faturamento Hoje</span>
              <p className="text-2xl font-black text-neutral-900 mt-1">
                R$ {todayTotalRevenue.toFixed(2)}
              </p>
              <span className="text-[11px] text-green-700 font-bold mt-1 block">
                ↑ Tempo real com comandas
              </span>
            </div>

            <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-xs">
              <span className="text-xs text-neutral-500 font-bold">Pedidos na Mesa</span>
              <p className="text-2xl font-black text-neutral-900 mt-1">
                {totalOrdersCount}
              </p>
              <span className="text-[11px] text-neutral-600 font-semibold mt-1 block">
                Total de envios à cozinha
              </span>
            </div>

            <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-xs">
              <span className="text-xs text-neutral-500 font-bold">Ticket Médio</span>
              <p className="text-2xl font-black text-neutral-900 mt-1">
                R$ {averageTicket.toFixed(2)}
              </p>
              <span className="text-[11px] text-neutral-600 font-semibold mt-1 block">
                Por pedido realizado
              </span>
            </div>

            <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-xs">
              <span className="text-xs text-neutral-500 font-bold">Mesas em Atendimento</span>
              <p className="text-2xl font-black text-neutral-900 mt-1">
                {occupiedTablesCount} / {restaurantTables.length}
              </p>
              <span className="text-[11px] text-green-700 font-bold mt-1 block">
                {Math.round((occupiedTablesCount / (restaurantTables.length || 1)) * 100)}% de ocupação
              </span>
            </div>
          </div>

          {/* Orders Stream List */}
          <div className="bg-white border border-neutral-200 rounded-3xl p-5 space-y-4 shadow-xs">
            <h3 className="font-black text-base text-neutral-900">
              Histórico de Pedidos de Hoje
            </h3>
            <div className="space-y-2">
              {restaurantOrders.map(ord => (
                <div
                  key={ord.id}
                  className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-black text-neutral-900 text-sm">#{ord.orderNumber}</span>
                    <span className="bg-white border border-neutral-300 text-neutral-900 px-2 py-0.5 rounded font-bold">
                      {ord.tableName}
                    </span>
                    <span className="text-neutral-500">
                      {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="text-neutral-700 font-medium">
                    {ord.items.map(i => `${i.quantity}x ${i.name}`).join(' • ')}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-black text-neutral-900 text-sm">
                      R$ {ord.total.toFixed(2)}
                    </span>
                    <span className="bg-green-100 text-green-800 border border-green-200 px-2 py-0.5 rounded-full font-bold uppercase text-[10px]">
                      {ord.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PRODUCTS & REELS MENU MANAGER */}
      {activeTab === 'products' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-neutral-900">
                Pratos & Vídeos Cadastrados
              </h3>
              <p className="text-xs text-neutral-600">
                Gerencie preços, estoque, adicionais e sabores limitados (ex: Pizza GG 3 sabores)
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsCreatingProduct(true)}
              className="bg-red-600 hover:bg-red-700 text-white font-black text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Cadastrar Novo Item</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {restaurantProducts.map(prod => (
              <div
                key={prod.id}
                className="bg-white border border-neutral-200 rounded-2xl p-4 flex flex-col justify-between space-y-3 shadow-xs"
              >
                <div className="flex gap-3">
                  <img
                    src={prod.videoPoster || prod.mediaUrl}
                    alt=""
                    className="w-16 h-16 rounded-xl object-cover bg-neutral-100 shrink-0 border border-neutral-200"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-red-600 font-bold uppercase">
                        {prod.category}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                        prod.inStock
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {prod.inStock ? `${prod.stockCount || 0} em estoque` : 'Esgotado'}
                      </span>
                    </div>
                    <h4 className="font-black text-neutral-900 text-sm truncate mt-0.5">
                      {prod.name}
                    </h4>
                    <p className="text-xs text-neutral-600 line-clamp-2 mt-0.5">
                      {prod.description}
                    </p>
                  </div>
                </div>

                {prod.flavorsConfig && (
                  <div className="bg-neutral-50 p-2 rounded-xl text-[11px] text-neutral-800 border border-neutral-200 flex items-center justify-between">
                    <span>🍕 Sabores Limitados:</span>
                    <strong className="text-red-600">
                      Até {prod.flavorsConfig.maxFlavors} sabores ({prod.flavorsConfig.pricingRule})
                    </strong>
                  </div>
                )}

                {prod.customizationGroups && prod.customizationGroups.length > 0 && (
                  <div className="text-[11px] text-neutral-600 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-red-600" />
                    <span>{prod.customizationGroups.length} grupo(s) de personalização</span>
                  </div>
                )}

                <div className="pt-2 border-t border-neutral-200 flex items-center justify-between">
                  <span className="text-base font-black text-neutral-900">
                    R$ {prod.price.toFixed(2)}
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditingProduct(prod)}
                      className="p-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteProduct(prod.id)}
                      className="p-2 rounded-lg bg-neutral-100 hover:bg-red-50 text-neutral-400 hover:text-red-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: CUSTOMER REVIEWS & FEEDBACK SYSTEM */}
      {activeTab === 'reviews' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Rating Summary Header */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Score Card */}
            <div className="bg-white border border-neutral-200 rounded-3xl p-5 flex flex-col items-center justify-center text-center shadow-xs">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                Média Geral de Avaliações
              </span>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-4xl font-black text-neutral-900">
                  {reviewsSummary.averageRating}
                </span>
                <div className="flex text-green-600">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${i < Math.round(reviewsSummary.averageRating) ? 'fill-green-600 text-green-600' : 'text-neutral-300'}`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-xs text-neutral-500 mt-1 font-semibold">
                Baseado em {reviewsSummary.totalReviews} avaliações enviadas das mesas
              </p>
            </div>

            {/* Stars Breakdown */}
            <div className="bg-white border border-neutral-200 rounded-3xl p-5 space-y-1.5 shadow-xs md:col-span-2">
              <h4 className="text-xs font-black uppercase text-neutral-500">Distribuição por Estrelas</h4>
              {[5, 4, 3, 2, 1].map(stars => {
                const count = reviewsSummary.ratingCounts[stars] || 0;
                const percent = reviewsSummary.totalReviews > 0 ? (count / reviewsSummary.totalReviews) * 100 : 0;
                return (
                  <div key={stars} className="flex items-center gap-2 text-xs">
                    <span className="w-12 font-bold text-neutral-800 flex items-center gap-1">
                      {stars} <Star className="w-3 h-3 fill-green-600 text-green-600" />
                    </span>
                    <div className="flex-1 bg-neutral-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-green-600 h-full rounded-full transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="w-8 text-right font-mono font-bold text-neutral-700">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dish Ranking & Areas for Improvement */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top Popular Dishes */}
            <div className="bg-white border border-neutral-200 rounded-3xl p-5 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 text-green-700 font-black text-sm">
                <ThumbsUp className="w-4 h-4" />
                <span>🏆 Pratos Mais Populares & Mais Bem Avaliados</span>
              </div>
              <div className="space-y-2">
                {dishReviewsRanking.slice(0, 3).map(({ product, averageRating, reviewsCount }) => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-neutral-50 border border-neutral-200 rounded-xl">
                    <div className="flex items-center gap-2.5">
                      <img src={product.videoPoster || product.mediaUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      <div>
                        <div className="font-bold text-xs text-neutral-900">{product.name}</div>
                        <span className="text-[10px] text-neutral-500">{reviewsCount} avaliações</span>
                      </div>
                    </div>
                    <span className="font-black text-green-700 text-sm flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-green-600 text-green-600" />
                      {averageRating}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Improvement Insights */}
            <div className="bg-white border border-neutral-200 rounded-3xl p-5 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 text-red-600 font-black text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Oportunidades de Melhoria & Feedback das Mesas</span>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Utilize os comentários deixados pelos clientes na mesa para ajustar o tempo de forno, temperatura e ponto dos ingredientes.
              </p>
              <div className="space-y-2">
                {dishReviewsRanking.filter(d => d.averageRating < 4.8).slice(0, 2).map(({ product, averageRating, reviewsCount }) => (
                  <div key={product.id} className="p-3 bg-red-50/50 border border-red-200 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-neutral-900">{product.name}</div>
                      <span className="text-[10px] text-red-600">Requer atenção na apresentação</span>
                    </div>
                    <span className="font-bold text-xs text-neutral-700">{averageRating} ★</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Customer Reviews Feed */}
          <div className="bg-white border border-neutral-200 rounded-3xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-red-600" />
                <h3 className="font-black text-base text-neutral-900">
                  Feed de Avaliações em Tempo Real
                </h3>
              </div>
              <span className="text-xs font-bold text-neutral-500">
                {restaurantReviews.length} avaliações recebidas
              </span>
            </div>

            <div className="space-y-3">
              {restaurantReviews.map(rev => (
                <div key={rev.id} className="p-4 bg-neutral-50 border border-neutral-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-neutral-900">
                        {rev.customerName || 'Cliente na Mesa'}
                      </span>
                      <span className="text-[11px] bg-white border border-neutral-300 text-neutral-700 px-2 py-0.5 rounded-full font-bold">
                        {rev.tableName}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-green-600 text-green-600' : 'text-neutral-300'}`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="text-xs font-semibold text-red-600">
                    Prato: {rev.productName}
                  </div>

                  <p className="text-xs text-neutral-700 leading-relaxed font-normal">
                    "{rev.comment}"
                  </p>

                  {rev.dishHighlights && rev.dishHighlights.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap pt-1">
                      {rev.dishHighlights.map((hl, i) => (
                        <span key={i} className="text-[10px] bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-bold">
                          ✓ {hl}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="text-[10px] text-neutral-400 pt-1">
                    Enviado em {new Date(rev.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: TABLES & QR CODE GENERATION */}
      {activeTab === 'tables' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white border border-neutral-200 rounded-3xl p-5 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-black text-base text-neutral-900">
                  Cadastrar Nova Mesa com QR Code
                </h3>
                <p className="text-xs text-neutral-600">
                  Cada mesa gera um QR Code exclusivo com identificação automática sem necessidade de login.
                </p>
              </div>

              <form onSubmit={handleCreateNewTable} className="flex gap-2 w-full sm:w-auto">
                <input
                  type="number"
                  required
                  placeholder="Nº da Mesa"
                  value={newTableNumber}
                  onChange={e => setNewTableNumber(e.target.value)}
                  className="w-24 bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-xs text-neutral-900"
                />
                <input
                  type="text"
                  placeholder="Nome (ex: Varanda, Janela)"
                  value={newTableLabel}
                  onChange={e => setNewTableLabel(e.target.value)}
                  className="flex-1 sm:w-44 bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-xs text-neutral-900"
                />
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white font-black text-xs px-4 py-2 rounded-xl transition-colors shrink-0 cursor-pointer"
                >
                  Adicionar Mesa
                </button>
              </form>
            </div>
          </div>

          {/* Tables Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {restaurantTables.map(tbl => (
              <div
                key={tbl.id}
                className="bg-white border border-neutral-200 rounded-2xl p-4 flex flex-col justify-between space-y-3 shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="w-9 h-9 rounded-xl bg-neutral-900 text-white font-black text-sm flex items-center justify-center">
                      {tbl.number}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      tbl.status === 'occupied'
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : tbl.status === 'bill_requested'
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : 'bg-neutral-100 text-neutral-700 border-neutral-200'
                    }`}>
                      {tbl.status === 'occupied' ? 'Ocupada' : tbl.status === 'bill_requested' ? 'Pediu Conta' : 'Livre'}
                    </span>
                  </div>
                  <h4 className="font-black text-neutral-900 text-sm mt-2">{tbl.label}</h4>
                  <p className="text-xs text-neutral-600 mt-0.5">
                    Consumo hoje: <strong className="text-neutral-900">R$ {tbl.totalSpent?.toFixed(2) || '0.00'}</strong>
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-neutral-200">
                  <button
                    type="button"
                    onClick={() => setSelectedTableForQr(tbl)}
                    className="w-full bg-neutral-900 hover:bg-black text-white font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5 text-red-400" />
                    <span>Ver QR Code de Mesa</span>
                  </button>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleSimulateTable(tbl.id)}
                      className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-[11px] py-1.5 rounded-lg text-center cursor-pointer"
                    >
                      Abrir Mesa
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteTable(tbl.id)}
                      className="p-1.5 text-neutral-400 hover:text-red-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: COUPONS & DELIVERY FEES */}
      {activeTab === 'coupons' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Coupon Form */}
          <div className="bg-white border border-neutral-200 rounded-3xl p-5 space-y-4 shadow-xs">
            <h3 className="font-black text-base text-neutral-900">Criar Novo Cupom de Desconto</h3>
            <form onSubmit={handleCreateCoupon} className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              <input
                type="text"
                required
                placeholder="Código (ex: PIZZA15OFF)"
                value={newCouponCode}
                onChange={e => setNewCouponCode(e.target.value.toUpperCase())}
                className="bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-xs text-neutral-900 uppercase font-mono font-bold"
              />
              <select
                value={newCouponType}
                onChange={e => setNewCouponType(e.target.value as any)}
                className="bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-xs text-neutral-900"
              >
                <option value="percentage">Porcentagem (%)</option>
                <option value="fixed">Valor Fixo (R$)</option>
              </select>
              <input
                type="number"
                step="0.5"
                required
                placeholder="Valor (ex: 15 ou 20.00)"
                value={newCouponValue}
                onChange={e => setNewCouponValue(e.target.value)}
                className="bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-xs text-neutral-900 font-bold"
              />
              <input
                type="number"
                step="5"
                placeholder="Pedido Mínimo (R$)"
                value={newCouponMinOrder}
                onChange={e => setNewCouponMinOrder(e.target.value)}
                className="bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-xs text-neutral-900"
              />
              <button
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white font-black text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer"
              >
                Criar Cupom
              </button>
            </form>

            {/* Coupons List */}
            <div className="space-y-2 pt-3 border-t border-neutral-200">
              <h4 className="text-xs font-black uppercase text-neutral-500">Cupons Ativos</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {restaurantCoupons.map(coup => (
                  <div
                    key={coup.id}
                    className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-mono font-black text-neutral-900 text-sm">
                        {coup.code}
                      </span>
                      <p className="text-xs text-red-600 font-bold mt-0.5">
                        {coup.discountType === 'percentage'
                          ? `${coup.discountValue}% OFF`
                          : `R$ ${coup.discountValue.toFixed(2)} OFF`}
                        {coup.minOrderValue > 0 && ` (Min: R$ ${coup.minOrderValue})`}
                      </p>
                      <span className="text-[10px] text-neutral-500">
                        {coup.usedCount} vezes utilizado
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleCouponActive(coup.id)}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg border cursor-pointer ${
                          coup.active ? 'bg-green-100 text-green-800 border-green-300' : 'bg-neutral-200 text-neutral-600'
                        }`}
                      >
                        {coup.active ? 'Ativo' : 'Pausado'}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteCoupon(coup.id)}
                        className="text-neutral-400 hover:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Delivery Zones */}
          <div className="bg-white border border-neutral-200 rounded-3xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-red-600" />
              <h3 className="font-black text-base text-neutral-900">Taxas de Entrega por Região / Raio</h3>
            </div>
            <p className="text-xs text-neutral-600">
              Configure as taxas aplicadas quando o cliente optar por delivery ou entrega externa:
            </p>

            <div className="space-y-2">
              {restaurantZones.map(zone => (
                <div
                  key={zone.id}
                  className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <span className="font-bold text-neutral-900 text-sm">{zone.name}</span>
                    <p className="text-neutral-500 mt-0.5">
                      Raio: até {zone.radiusKm} km • Tempo estimado: ~{zone.estimatedMinutes} min
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-base font-black text-neutral-900">
                      R$ {zone.fee.toFixed(2)}
                    </span>
                    <span className="text-[10px] bg-green-100 text-green-800 border border-green-200 px-2 py-0.5 rounded font-bold">
                      Ativa
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {(isCreatingProduct || editingProduct) && (
        <ProductEditModal
          product={editingProduct}
          restaurantId={activeRestaurant.id}
          onClose={() => {
            setIsCreatingProduct(false);
            setEditingProduct(null);
          }}
          onSave={(data) => {
            if (editingProduct) {
              updateProduct(editingProduct.id, data);
            } else {
              addProduct(data);
            }
          }}
        />
      )}

      {selectedTableForQr && (
        <TableQrModal
          table={selectedTableForQr}
          restaurant={activeRestaurant}
          onClose={() => setSelectedTableForQr(null)}
          onSimulateTable={handleSimulateTable}
        />
      )}
    </div>
  );
};
