import { pgTable, text, serial, integer, doublePrecision, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';

// Restaurants / Merchants (Multi-tenant SaaS)
export const restaurants = pgTable('restaurants', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  logo: text('logo').notNull(),
  banner: text('banner'),
  category: text('category').notNull(),
  primaryColor: text('primary_color').default('#dc2626'),
  accentColor: text('accent_color').default('#16a34a'),
  description: text('description'),
  address: text('address'),
  phone: text('phone'),
  tablesCount: integer('tables_count').default(10),
  status: text('status').default('active'),
  saasPlan: text('saas_plan').default('Pro'),
  monthlyFee: doublePrecision('monthly_fee').default(149.90),
  createdAt: timestamp('created_at').defaultNow(),
});

// Restaurant Tables
export const tables = pgTable('tables', {
  id: text('id').primaryKey(),
  restaurantId: text('restaurant_id').notNull().references(() => restaurants.id),
  number: integer('number').notNull(),
  label: text('label').notNull(),
  qrCodeUrl: text('qr_code_url'),
  status: text('status').default('free'), // free, occupied, bill_requested
  activeOrdersCount: integer('active_orders_count').default(0),
  totalSpent: doublePrecision('total_spent').default(0),
  waiterCalled: boolean('waiter_called').default(false),
  waiterCallReason: text('waiter_call_reason'),
  waiterCallTime: timestamp('waiter_call_time'),
});

// Products & Menu Items
export const products = pgTable('products', {
  id: text('id').primaryKey(),
  restaurantId: text('restaurant_id').notNull().references(() => restaurants.id),
  name: text('name').notNull(),
  category: text('category').notNull(),
  description: text('description').notNull(),
  price: doublePrecision('price').notNull(),
  mediaType: text('media_type').default('image'), // video, image
  mediaUrl: text('media_url').notNull(),
  videoPoster: text('video_poster'),
  inStock: boolean('in_stock').default(true),
  stockCount: integer('stock_count').default(99),
  isHighlight: boolean('is_highlight').default(false),
  preparationTimeMin: integer('preparation_time_min').default(15),
  flavorsConfig: jsonb('flavors_config'),
  customizationGroups: jsonb('customization_groups'),
  ingredients: jsonb('ingredients'),
  averageRating: doublePrecision('average_rating').default(5.0),
  reviewsCount: integer('reviews_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// Customer Orders
export const orders = pgTable('orders', {
  id: text('id').primaryKey(),
  orderNumber: integer('order_number').notNull(),
  restaurantId: text('restaurant_id').notNull().references(() => restaurants.id),
  tableId: text('table_id').notNull(),
  tableName: text('table_name').notNull(),
  customerName: text('customer_name'),
  customerPhone: text('customer_phone'),
  customerEmail: text('customer_email'),
  orderType: text('order_type').default('mesa'), // mesa, delivery, retirada
  items: jsonb('items').notNull(),
  subtotal: doublePrecision('subtotal').notNull(),
  discount: doublePrecision('discount').default(0),
  couponCode: text('coupon_code'),
  deliveryFee: doublePrecision('delivery_fee').default(0),
  serviceTax: doublePrecision('service_tax').default(0),
  total: doublePrecision('total').notNull(),
  status: text('status').default('received'), // received, preparing, ready, delivered, paid, cancelled
  paymentMethod: text('payment_method'), // pix, credit_card, debit_card, cash
  paymentLocation: text('payment_location').default('cashier'), // cashier, table
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Customer Reviews
export const customerReviews = pgTable('customer_reviews', {
  id: text('id').primaryKey(),
  restaurantId: text('restaurant_id').notNull().references(() => restaurants.id),
  productId: text('product_id').notNull().references(() => products.id),
  productName: text('product_name').notNull(),
  tableId: text('table_id').notNull(),
  tableName: text('table_name').notNull(),
  customerName: text('customer_name'),
  rating: integer('rating').notNull(),
  comment: text('comment').notNull(),
  dishHighlights: jsonb('dish_highlights'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Discount Coupons
export const coupons = pgTable('coupons', {
  id: text('id').primaryKey(),
  restaurantId: text('restaurant_id').notNull().references(() => restaurants.id),
  code: text('code').notNull(),
  discountType: text('discount_type').notNull(), // percentage, fixed
  discountValue: doublePrecision('discount_value').notNull(),
  minOrderValue: doublePrecision('min_order_value').default(0),
  active: boolean('active').default(true),
  usedCount: integer('used_count').default(0),
  expiryDate: text('expiry_date'),
});

// Dwell Time Analytics (view duration per product)
export const dwellMetrics = pgTable('dwell_metrics', {
  id: serial('id').primaryKey(),
  productId: text('product_id').notNull().references(() => products.id),
  restaurantId: text('restaurant_id').notNull().references(() => restaurants.id),
  totalViewDurationSec: integer('total_view_duration_sec').default(0),
  impressionCount: integer('impression_count').default(0),
  orderCount: integer('order_count').default(0),
  lastViewedAt: timestamp('last_viewed_at').defaultNow(),
});
