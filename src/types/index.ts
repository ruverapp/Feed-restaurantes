export type MediaType = 'video' | 'image';

export type PricingRule = 'highest' | 'average' | 'fixed_with_deltas';

export interface FlavorOption {
  id: string;
  name: string;
  description?: string;
  priceDelta?: number; // extra cost or relative price
  isSpecial?: boolean;
}

export interface FlavorsConfig {
  minFlavors: number;
  maxFlavors: number;
  pricingRule: PricingRule;
  options: FlavorOption[];
}

export interface AddonItem {
  id: string;
  name: string;
  price: number;
}

export interface AddonGroup {
  id: string;
  name: string;
  min: number;
  max: number;
  items: AddonItem[];
}

export interface CustomOption {
  id: string;
  name: string;
  description?: string;
  price: number; // additional price or flavor delta
  isDefault?: boolean;
}

export interface CustomizationGroup {
  id: string;
  name: string;
  type: 'flavors' | 'addons' | 'options';
  min: number;
  max: number;
  pricingRule?: PricingRule;
  options: CustomOption[];
}

export interface Product {
  id: string;
  restaurantId: string;
  name: string;
  category: string;
  description: string;
  price: number; // Base price
  mediaType: MediaType;
  mediaUrl: string;
  videoPoster?: string;
  inStock: boolean;
  stockCount?: number;
  isHighlight?: boolean;
  preparationTimeMin?: number;
  flavorsConfig?: FlavorsConfig;
  addonGroups?: AddonGroup[];
  customizationGroups?: CustomizationGroup[];
  ingredients?: string[];
  averageRating?: number;
  reviewsCount?: number;
}

export interface SelectedFlavor {
  flavorId: string;
  name: string;
  priceDelta?: number;
}

export interface SelectedAddon {
  addonId: string;
  name: string;
  price: number;
  groupId?: string;
}

export interface CartItem {
  cartItemId: string;
  productId: string;
  name: string;
  basePrice: number;
  finalUnitPrice: number;
  quantity: number;
  selectedFlavors?: SelectedFlavor[];
  selectedAddons?: SelectedAddon[];
  customSelections?: Record<string, { optionId: string; name: string; price: number }[]>;
  notes?: string;
  mediaUrl?: string;
}

export type OrderStatus = 'received' | 'preparing' | 'ready' | 'delivered' | 'paid' | 'cancelled';

export interface Order {
  id: string;
  orderNumber: number;
  restaurantId: string;
  tableId: string;
  tableName: string;
  customerName?: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  couponCode?: string;
  deliveryFee?: number;
  total: number;
  status: OrderStatus;
  createdAt: string; // ISO string
  notes?: string;
  paymentMethod?: 'pix' | 'credit_card' | 'debit_card' | 'cash';
  rated?: boolean;
}

export interface CustomerReview {
  id: string;
  restaurantId: string;
  productId: string;
  productName: string;
  tableId: string;
  tableName: string;
  customerName?: string;
  rating: number; // 1 to 5
  comment: string;
  createdAt: string;
  dishHighlights?: string[];
}

export interface PushNotificationEvent {
  id: string;
  timestamp: string;
  target: 'customer' | 'waiter' | 'all';
  tableId?: string;
  tableName?: string;
  orderId?: string;
  orderNumber?: number;
  status?: OrderStatus;
  title: string;
  message: string;
  type: 'order_status' | 'waiter_alert' | 'review_received';
}

export interface Table {
  id: string;
  restaurantId: string;
  number: number;
  label: string;
  qrCodeUrl?: string;
  status: 'free' | 'occupied' | 'bill_requested';
  activeOrdersCount: number;
  totalSpent: number;
  waiterCalled?: boolean;
  waiterCallReason?: string;
  waiterCallTime?: string;
}

export interface Coupon {
  id: string;
  restaurantId: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderValue: number;
  active: boolean;
  usedCount: number;
  expiryDate?: string;
}

export interface DeliveryZone {
  id: string;
  restaurantId: string;
  name: string;
  radiusKm: number;
  fee: number;
  estimatedMinutes: number;
  active: boolean;
}

export interface DwellMetric {
  productId: string;
  restaurantId: string;
  totalViewDurationSec: number;
  impressionCount: number;
  orderCount: number;
  lastViewedAt: string;
}

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  logo: string;
  banner: string;
  category: string;
  primaryColor: string;
  accentColor: string;
  description: string;
  address: string;
  phone: string;
  tablesCount: number;
  status: 'active' | 'suspended';
  saasPlan: 'Starter' | 'Pro' | 'Enterprise';
  monthlyFee: number;
}

export type AppViewMode = 'customer' | 'waiter' | 'merchant_admin' | 'super_admin';

export type CustomerSubTab = 'reels' | 'menu' | 'bill';
