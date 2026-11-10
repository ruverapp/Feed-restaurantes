import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Restaurant,
  Product,
  Table,
  Order,
  CartItem,
  Coupon,
  DeliveryZone,
  DwellMetric,
  AppViewMode,
  CustomerSubTab,
  OrderStatus,
  CustomerReview,
  PushNotificationEvent,
} from '../types';
import {
  INITIAL_RESTAURANTS,
  INITIAL_PRODUCTS,
  INITIAL_TABLES,
  INITIAL_ORDERS,
  INITIAL_COUPONS,
  INITIAL_DELIVERY_ZONES,
  INITIAL_DWELL_METRICS,
  INITIAL_REVIEWS,
} from '../data/seedData';
import { calculateCouponDiscount } from '../utils/pricing';

interface StoreContextType {
  restaurants: Restaurant[];
  activeRestaurant: Restaurant;
  setActiveRestaurantId: (id: string) => void;
  activeTable: Table | undefined;
  activeTableId: string;
  setActiveTableId: (id: string) => void;
  activeViewMode: AppViewMode;
  setActiveViewMode: (mode: AppViewMode) => void;
  customerSubTab: CustomerSubTab;
  setCustomerSubTab: (tab: CustomerSubTab) => void;

  // Data
  products: Product[];
  tables: Table[];
  orders: Order[];
  cart: CartItem[];
  coupons: Coupon[];
  deliveryZones: DeliveryZone[];
  dwellMetrics: Record<string, DwellMetric>;
  reviews: CustomerReview[];

  // Customer Actions
  addToCart: (item: CartItem) => void;
  removeFromCart: (cartItemId: string) => void;
  updateCartQuantity: (cartItemId: string, delta: number) => void;
  clearCart: () => void;
  submitOrder: (notes?: string, couponCode?: string) => Promise<Order>;
  callWaiter: (tableId?: string, reason?: string) => void;
  dismissWaiterCall: (tableId: string) => void;
  requestBill: (tableId: string, paymentMethod: 'pix' | 'credit_card' | 'debit_card' | 'cash') => void;
  recordDwellTime: (productId: string, durationSeconds: number, incrementImpression?: boolean) => void;
  addReview: (review: Omit<CustomerReview, 'id' | 'createdAt'>) => void;

  // Waiter & Admin Actions
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  addProduct: (product: Omit<Product, 'id'>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addTable: (number: number, label: string) => Table;
  updateTable: (id: string, updates: Partial<Table>) => void;
  deleteTable: (id: string) => void;
  addCoupon: (coupon: Omit<Coupon, 'id' | 'usedCount'>) => Coupon;
  toggleCouponActive: (couponId: string) => void;
  deleteCoupon: (couponId: string) => void;
  updateDeliveryZone: (id: string, updates: Partial<DeliveryZone>) => void;
  addRestaurant: (restaurant: Omit<Restaurant, 'id'>) => Restaurant;

  // Push notifications
  activePushToast: PushNotificationEvent | null;
  dismissPushToast: () => void;
  pushSoundEnabled: boolean;
  setPushSoundEnabled: (enabled: boolean) => void;

  // Legacy helper
  latestNotification: string | null;
  clearNotification: () => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

const STORAGE_KEYS = {
  RESTAURANTS: 'reels_restaurants_v2',
  PRODUCTS: 'reels_products_v2',
  TABLES: 'reels_tables_v2',
  ORDERS: 'reels_orders_v2',
  COUPONS: 'reels_coupons_v2',
  DELIVERY_ZONES: 'reels_delivery_v2',
  DWELL: 'reels_dwell_v2',
  REVIEWS: 'reels_reviews_v2',
  ACTIVE_REST: 'reels_active_rest_id_v2',
  ACTIVE_TABLE: 'reels_active_table_id_v2',
};

// Gentle synthesized chime using Web Audio API
function playPushNotificationChime(type: 'order' | 'ready' | 'alert' = 'order') {
  try {
    if (typeof window === 'undefined') return;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === 'ready') {
      // Happy ascending double ping
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.24); // G5
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.55);
    } else {
      // Clean modern bell
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    }
  } catch {
    // Audio context may be restricted without user gesture
  }
}

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Read initial state
  const [restaurants, setRestaurants] = useState<Restaurant[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RESTAURANTS);
      return saved ? JSON.parse(saved) : INITIAL_RESTAURANTS;
    } catch {
      return INITIAL_RESTAURANTS;
    }
  });

  const [activeRestaurantId, setActiveRestaurantIdState] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    const storeParam = params.get('store');
    if (storeParam) {
      const found = INITIAL_RESTAURANTS.find(r => r.slug === storeParam || r.id === storeParam);
      if (found) return found.id;
    }
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_REST);
    return saved || 'rest_bella_napoli';
  });

  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  const [tables, setTables] = useState<Table[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TABLES);
      return saved ? JSON.parse(saved) : INITIAL_TABLES;
    } catch {
      return INITIAL_TABLES;
    }
  });

  const [activeTableId, setActiveTableIdState] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    const mesaParam = params.get('mesa') || params.get('table');
    if (mesaParam) {
      const found = INITIAL_TABLES.find(t => t.number.toString() === mesaParam || t.id === mesaParam);
      if (found) return found.id;
    }
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_TABLE);
    return saved || 'tbl_4';
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
      return saved ? JSON.parse(saved) : INITIAL_ORDERS;
    } catch {
      return INITIAL_ORDERS;
    }
  });

  const [cart, setCart] = useState<CartItem[]>([]);

  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COUPONS);
      return saved ? JSON.parse(saved) : INITIAL_COUPONS;
    } catch {
      return INITIAL_COUPONS;
    }
  });

  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DELIVERY_ZONES);
      return saved ? JSON.parse(saved) : INITIAL_DELIVERY_ZONES;
    } catch {
      return INITIAL_DELIVERY_ZONES;
    }
  });

  const [dwellMetrics, setDwellMetrics] = useState<Record<string, DwellMetric>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DWELL);
      if (saved) return JSON.parse(saved);
      const map: Record<string, DwellMetric> = {};
      INITIAL_DWELL_METRICS.forEach(m => {
        map[m.productId] = m;
      });
      return map;
    } catch {
      return {};
    }
  });

  const [reviews, setReviews] = useState<CustomerReview[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.REVIEWS);
      return saved ? JSON.parse(saved) : INITIAL_REVIEWS;
    } catch {
      return INITIAL_REVIEWS;
    }
  });

  const [activeViewMode, setActiveViewMode] = useState<AppViewMode>('customer');
  const [customerSubTab, setCustomerSubTab] = useState<CustomerSubTab>('reels');
  const [latestNotification, setLatestNotification] = useState<string | null>(null);

  // Push notification state
  const [activePushToast, setActivePushToast] = useState<PushNotificationEvent | null>(null);
  const [pushSoundEnabled, setPushSoundEnabled] = useState(true);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RESTAURANTS, JSON.stringify(restaurants));
  }, [restaurants]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(tables));
  }, [tables]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COUPONS, JSON.stringify(coupons));
  }, [coupons]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DELIVERY_ZONES, JSON.stringify(deliveryZones));
  }, [deliveryZones]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DWELL, JSON.stringify(dwellMetrics));
  }, [dwellMetrics]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
  }, [reviews]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_REST, activeRestaurantId);
  }, [activeRestaurantId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_TABLE, activeTableId);
  }, [activeTableId]);

  const triggerPushNotification = useCallback((event: Omit<PushNotificationEvent, 'id' | 'timestamp'>) => {
    const fullEvent: PushNotificationEvent = {
      ...event,
      id: `push_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };

    setActivePushToast(fullEvent);
    if (pushSoundEnabled) {
      playPushNotificationChime(event.status === 'ready' ? 'ready' : 'order');
    }

    // Auto dismiss after 7 seconds
    setTimeout(() => {
      setActivePushToast(prev => (prev?.id === fullEvent.id ? null : prev));
    }, 7000);
  }, [pushSoundEnabled]);

  // Cross-tab broadcast channel
  useEffect(() => {
    if (typeof window === 'undefined' || !window.BroadcastChannel) return;
    const channel = new BroadcastChannel('reels_menu_sync_bus_v2');

    channel.onmessage = (event) => {
      const { type, payload } = event.data || {};
      if (type === 'NEW_ORDER') {
        setOrders(prev => [payload, ...prev.filter(o => o.id !== payload.id)]);
        triggerPushNotification({
          target: 'waiter',
          tableId: payload.tableId,
          tableName: payload.tableName,
          orderId: payload.id,
          orderNumber: payload.orderNumber,
          title: `🔔 Novo Pedido #${payload.orderNumber}!`,
          message: `${payload.tableName} enviou ${payload.items.length} item(ns) para a cozinha (R$ ${payload.total.toFixed(2)}).`,
          type: 'order_status',
          status: 'received',
        });
      } else if (type === 'STATUS_UPDATE') {
        const { orderId, status, orderNumber, tableName, tableId } = payload;
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));

        let title = 'Atualização do Pedido';
        let message = `Seu pedido #${orderNumber} mudou de status.`;

        if (status === 'preparing') {
          title = '🔥 Pedido em Preparo!';
          message = `O chef começou a preparar seu pedido #${orderNumber} na cozinha.`;
        } else if (status === 'ready') {
          title = '🛎️ Pedido Pronto para Servir!';
          message = `Seu pedido #${orderNumber} está pronto e o garçom está levando até sua mesa!`;
        } else if (status === 'delivered') {
          title = '🍽️ Bom Apetite!';
          message = `Seu pedido #${orderNumber} foi servido na mesa. Conte-nos o que achou avaliando o prato!`;
        }

        triggerPushNotification({
          target: 'customer',
          tableId,
          tableName,
          orderId,
          orderNumber,
          title,
          message,
          type: 'order_status',
          status,
        });
      } else if (type === 'WAITER_CALL') {
        setTables(prev => prev.map(t => t.id === payload.tableId ? { ...t, waiterCalled: true, waiterCallReason: payload.reason, waiterCallTime: payload.time } : t));
        triggerPushNotification({
          target: 'waiter',
          tableId: payload.tableId,
          tableName: payload.tableName,
          title: `🚨 Chamado na ${payload.tableName}`,
          message: `Motivo: ${payload.reason || 'Atendimento solicitado'}`,
          type: 'waiter_alert',
        });
      } else if (type === 'BILL_REQUEST') {
        setTables(prev => prev.map(t => t.id === payload.tableId ? { ...t, status: 'bill_requested', waiterCalled: true, waiterCallReason: `Conta solicitada (${payload.method.toUpperCase()})` } : t));
        triggerPushNotification({
          target: 'waiter',
          tableId: payload.tableId,
          tableName: payload.tableName,
          title: `🧾 Pedido de Conta na ${payload.tableName}`,
          message: `O cliente deseja pagar via ${payload.method.toUpperCase()}. Traga a maquininha!`,
          type: 'waiter_alert',
        });
      } else if (type === 'NEW_REVIEW') {
        setReviews(prev => [payload, ...prev.filter(r => r.id !== payload.id)]);
        triggerPushNotification({
          target: 'waiter',
          title: `⭐ Nova Avaliação (${payload.rating} estrelas)!`,
          message: `"${payload.productName}": ${payload.comment.slice(0, 70)}...`,
          type: 'review_received',
        });
      }
    };

    return () => {
      channel.close();
    };
  }, [triggerPushNotification]);

  const broadcast = useCallback((type: string, payload: any) => {
    try {
      if (typeof window !== 'undefined' && window.BroadcastChannel) {
        const channel = new BroadcastChannel('reels_menu_sync_bus_v2');
        channel.postMessage({ type, payload });
        channel.close();
      }
    } catch (e) {
      console.warn('Broadcast error', e);
    }
  }, []);

  const activeRestaurant = useMemo(() => {
    return restaurants.find(r => r.id === activeRestaurantId) || restaurants[0] || INITIAL_RESTAURANTS[0];
  }, [restaurants, activeRestaurantId]);

  const activeTable = useMemo(() => {
    return tables.find(t => t.id === activeTableId && t.restaurantId === activeRestaurantId) ||
      tables.find(t => t.restaurantId === activeRestaurantId);
  }, [tables, activeTableId, activeRestaurantId]);

  const setActiveRestaurantId = useCallback((id: string) => {
    setActiveRestaurantIdState(id);
    const firstTable = tables.find(t => t.restaurantId === id);
    if (firstTable) {
      setActiveTableIdState(firstTable.id);
    }
  }, [tables]);

  const setActiveTableId = useCallback((id: string) => {
    setActiveTableIdState(id);
  }, []);

  // Cart operations
  const addToCart = useCallback((item: CartItem) => {
    setCart(prev => {
      const existingIndex = prev.findIndex(ci =>
        ci.productId === item.productId &&
        JSON.stringify(ci.selectedFlavors) === JSON.stringify(item.selectedFlavors) &&
        JSON.stringify(ci.selectedAddons) === JSON.stringify(item.selectedAddons) &&
        JSON.stringify(ci.customSelections) === JSON.stringify(item.customSelections) &&
        ci.notes === item.notes
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + item.quantity,
        };
        return updated;
      }
      return [...prev, item];
    });

    triggerPushNotification({
      target: 'customer',
      title: '🛒 Item Adicionado!',
      message: `"${item.name}" foi adicionado à comanda da sua mesa.`,
      type: 'order_status',
    });
  }, [triggerPushNotification]);

  const removeFromCart = useCallback((cartItemId: string) => {
    setCart(prev => prev.filter(item => item.cartItemId !== cartItemId));
  }, []);

  const updateCartQuantity = useCallback((cartItemId: string, delta: number) => {
    setCart(prev =>
      prev
        .map(item => {
          if (item.cartItemId === cartItemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // Dwell-time metrics tracking
  const recordDwellTime = useCallback((productId: string, durationSeconds: number, incrementImpression = false) => {
    if (durationSeconds <= 0 && !incrementImpression) return;

    setDwellMetrics(prev => {
      const existing = prev[productId] || {
        productId,
        restaurantId: activeRestaurantId,
        totalViewDurationSec: 0,
        impressionCount: 0,
        orderCount: 0,
        lastViewedAt: new Date().toISOString(),
      };

      return {
        ...prev,
        [productId]: {
          ...existing,
          totalViewDurationSec: existing.totalViewDurationSec + Math.round(durationSeconds),
          impressionCount: existing.impressionCount + (incrementImpression ? 1 : 0),
          lastViewedAt: new Date().toISOString(),
        },
      };
    });
  }, [activeRestaurantId]);

  // Customer Reviews
  const addReview = useCallback((reviewData: Omit<CustomerReview, 'id' | 'createdAt'>) => {
    const newReview: CustomerReview = {
      ...reviewData,
      id: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };

    setReviews(prev => [newReview, ...prev]);

    // Recalculate average rating for product
    setProducts(prev =>
      prev.map(p => {
        if (p.id === reviewData.productId) {
          const currentCount = p.reviewsCount || 0;
          const currentAvg = p.averageRating || 5.0;
          const newCount = currentCount + 1;
          const newAvg = Number(((currentAvg * currentCount + reviewData.rating) / newCount).toFixed(1));
          return { ...p, averageRating: newAvg, reviewsCount: newCount };
        }
        return p;
      })
    );

    broadcast('NEW_REVIEW', newReview);

    triggerPushNotification({
      target: 'customer',
      title: '⭐ Avaliação Enviada!',
      message: `Muito obrigado pelo seu feedback sobre "${reviewData.productName}"!`,
      type: 'review_received',
    });
  }, [broadcast, triggerPushNotification]);

  // Order Submission
  const submitOrder = useCallback(async (notes?: string, couponCode?: string): Promise<Order> => {
    if (cart.length === 0) {
      throw new Error('Comanda vazia.');
    }

    const subtotal = cart.reduce((sum, item) => sum + item.finalUnitPrice * item.quantity, 0);

    let discount = 0;
    if (couponCode) {
      const appliedCoupon = coupons.find(c => c.restaurantId === activeRestaurantId && c.code.toUpperCase() === couponCode.trim().toUpperCase());
      discount = calculateCouponDiscount(subtotal, appliedCoupon);
      if (appliedCoupon && discount > 0) {
        setCoupons(prev => prev.map(c => c.id === appliedCoupon.id ? { ...c, usedCount: c.usedCount + 1 } : c));
      }
    }

    const total = Math.max(0, subtotal - discount);
    const orderNumber = Math.floor(100 + Math.random() * 900);
    const tableName = activeTable ? activeTable.label : 'Mesa Balcão';

    const newOrder: Order = {
      id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      orderNumber,
      restaurantId: activeRestaurantId,
      tableId: activeTableId,
      tableName,
      customerName: activeTable ? `Cliente ${activeTable.label}` : 'Cliente Mesa',
      items: [...cart],
      subtotal: Number(subtotal.toFixed(2)),
      discount: Number(discount.toFixed(2)),
      couponCode: discount > 0 ? couponCode : undefined,
      total: Number(total.toFixed(2)),
      status: 'received',
      createdAt: new Date().toISOString(),
      notes,
    };

    setOrders(prev => [newOrder, ...prev]);

    setTables(prev =>
      prev.map(t =>
        t.id === activeTableId
          ? {
              ...t,
              status: 'occupied',
              activeOrdersCount: (t.activeOrdersCount || 0) + 1,
              totalSpent: Number(((t.totalSpent || 0) + total).toFixed(2)),
            }
          : t
      )
    );

    setDwellMetrics(prev => {
      const updated = { ...prev };
      cart.forEach(item => {
        const metric = updated[item.productId] || {
          productId: item.productId,
          restaurantId: activeRestaurantId,
          totalViewDurationSec: 10,
          impressionCount: 1,
          orderCount: 0,
          lastViewedAt: new Date().toISOString(),
        };
        updated[item.productId] = {
          ...metric,
          orderCount: metric.orderCount + item.quantity,
        };
      });
      return updated;
    });

    setCart([]);
    broadcast('NEW_ORDER', newOrder);

    triggerPushNotification({
      target: 'customer',
      tableId: activeTableId,
      tableName,
      orderId: newOrder.id,
      orderNumber,
      title: '✅ Pedido Confirmado!',
      message: `Pedido #${orderNumber} enviado para a cozinha! Acompanhe o preparo aqui na tela.`,
      type: 'order_status',
      status: 'received',
    });

    return newOrder;
  }, [cart, coupons, activeRestaurantId, activeTable, activeTableId, broadcast, triggerPushNotification]);

  // Waiter Call
  const callWaiter = useCallback((tableId?: string, reason = 'Atendimento na mesa') => {
    const targetTableId = tableId || activeTableId;
    const now = new Date().toISOString();
    const table = tables.find(t => t.id === targetTableId);
    const tableName = table ? table.label : 'Mesa';

    setTables(prev =>
      prev.map(t =>
        t.id === targetTableId
          ? { ...t, waiterCalled: true, waiterCallReason: reason, waiterCallTime: now }
          : t
      )
    );

    broadcast('WAITER_CALL', { tableId: targetTableId, tableName, reason, time: now });

    triggerPushNotification({
      target: 'customer',
      title: '🔔 Garçom Notificado!',
      message: `A equipe do salão recebeu seu chamado para a ${tableName} e já está vindo.`,
      type: 'waiter_alert',
    });
  }, [activeTableId, tables, broadcast, triggerPushNotification]);

  const dismissWaiterCall = useCallback((tableId: string) => {
    setTables(prev =>
      prev.map(t =>
        t.id === tableId
          ? { ...t, waiterCalled: false, waiterCallReason: undefined, waiterCallTime: undefined }
          : t
      )
    );
  }, []);

  // Request Bill
  const requestBill = useCallback((tableId: string, paymentMethod: 'pix' | 'credit_card' | 'debit_card' | 'cash') => {
    const table = tables.find(t => t.id === tableId);
    const tableName = table ? table.label : 'Mesa';

    setTables(prev =>
      prev.map(t =>
        t.id === tableId
          ? {
              ...t,
              status: 'bill_requested',
              waiterCalled: true,
              waiterCallReason: `Conta solicitada (${paymentMethod.toUpperCase()})`,
            }
          : t
      )
    );

    broadcast('BILL_REQUEST', { tableId, tableName, method: paymentMethod });

    triggerPushNotification({
      target: 'customer',
      title: '🧾 Conta Solicitada!',
      message: `O garçom já foi avisado e trará o fechamento (${paymentMethod.toUpperCase()}) na ${tableName}.`,
      type: 'waiter_alert',
    });
  }, [tables, broadcast, triggerPushNotification]);

  // Update order status with customer push alerts
  const updateOrderStatus = useCallback((orderId: string, status: OrderStatus) => {
    let orderTarget: Order | undefined;
    setOrders(prev =>
      prev.map(o => {
        if (o.id === orderId) {
          orderTarget = { ...o, status };
          return orderTarget;
        }
        return o;
      })
    );

    if (orderTarget) {
      broadcast('STATUS_UPDATE', {
        orderId,
        status,
        orderNumber: orderTarget.orderNumber,
        tableName: orderTarget.tableName,
        tableId: orderTarget.tableId,
      });

      let title = 'Atualização do Pedido';
      let message = `Pedido #${orderTarget.orderNumber} atualizado.`;

      if (status === 'preparing') {
        title = '🔥 Pedido em Preparo!';
        message = `O chef começou a preparar o pedido #${orderTarget.orderNumber} na cozinha.`;
      } else if (status === 'ready') {
        title = '🛎️ Pedido Pronto para Servir!';
        message = `O pedido #${orderTarget.orderNumber} está pronto e saindo para a ${orderTarget.tableName}!`;
      } else if (status === 'delivered') {
        title = '🍽️ Entregue na Mesa!';
        message = `Pedido #${orderTarget.orderNumber} servido com sucesso na ${orderTarget.tableName}.`;
      }

      triggerPushNotification({
        target: 'all',
        tableId: orderTarget.tableId,
        tableName: orderTarget.tableName,
        orderId,
        orderNumber: orderTarget.orderNumber,
        title,
        message,
        type: 'order_status',
        status,
      });
    }
  }, [broadcast, triggerPushNotification]);

  // Product CRUD
  const addProduct = useCallback((productData: Omit<Product, 'id'>): Product => {
    const newProduct: Product = {
      ...productData,
      id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      averageRating: 5.0,
      reviewsCount: 0,
    };
    setProducts(prev => [newProduct, ...prev]);
    return newProduct;
  }, []);

  const updateProduct = useCallback((id: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)));
  }, []);

  const deleteProduct = useCallback((id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  }, []);

  // Table CRUD
  const addTable = useCallback((number: number, label: string): Table => {
    const newTable: Table = {
      id: `tbl_${Date.now()}`,
      restaurantId: activeRestaurantId,
      number,
      label,
      status: 'free',
      activeOrdersCount: 0,
      totalSpent: 0,
    };
    setTables(prev => [...prev, newTable]);
    return newTable;
  }, [activeRestaurantId]);

  const updateTable = useCallback((id: string, updates: Partial<Table>) => {
    setTables(prev => prev.map(t => (t.id === id ? { ...t, ...updates } : t)));
  }, []);

  const deleteTable = useCallback((id: string) => {
    setTables(prev => prev.filter(t => t.id !== id));
  }, []);

  // Coupon CRUD
  const addCoupon = useCallback((couponData: Omit<Coupon, 'id' | 'usedCount'>): Coupon => {
    const newCoupon: Coupon = {
      ...couponData,
      id: `coup_${Date.now()}`,
      usedCount: 0,
    };
    setCoupons(prev => [newCoupon, ...prev]);
    return newCoupon;
  }, []);

  const toggleCouponActive = useCallback((couponId: string) => {
    setCoupons(prev => prev.map(c => c.id === couponId ? { ...c, active: !c.active } : c));
  }, []);

  const deleteCoupon = useCallback((couponId: string) => {
    setCoupons(prev => prev.filter(c => c.id !== couponId));
  }, []);

  const updateDeliveryZone = useCallback((id: string, updates: Partial<DeliveryZone>) => {
    setDeliveryZones(prev => prev.map(z => z.id === id ? { ...z, ...updates } : z));
  }, []);

  const addRestaurant = useCallback((restaurantData: Omit<Restaurant, 'id'>): Restaurant => {
    const newRest: Restaurant = {
      ...restaurantData,
      id: `rest_${Date.now()}`,
    };
    setRestaurants(prev => [...prev, newRest]);
    return newRest;
  }, []);

  const clearNotification = useCallback(() => {
    setLatestNotification(null);
  }, []);

  const dismissPushToast = useCallback(() => {
    setActivePushToast(null);
  }, []);

  const value = {
    restaurants,
    activeRestaurant,
    setActiveRestaurantId,
    activeTable,
    activeTableId,
    setActiveTableId,
    activeViewMode,
    setActiveViewMode,
    customerSubTab,
    setCustomerSubTab,
    products,
    tables,
    orders,
    cart,
    coupons,
    deliveryZones,
    dwellMetrics,
    reviews,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    submitOrder,
    callWaiter,
    dismissWaiterCall,
    requestBill,
    recordDwellTime,
    addReview,
    updateOrderStatus,
    addProduct,
    updateProduct,
    deleteProduct,
    addTable,
    updateTable,
    deleteTable,
    addCoupon,
    toggleCouponActive,
    deleteCoupon,
    updateDeliveryZone,
    addRestaurant,
    activePushToast,
    dismissPushToast,
    pushSoundEnabled,
    setPushSoundEnabled,
    latestNotification,
    clearNotification,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within StoreProvider');
  }
  return context;
};
