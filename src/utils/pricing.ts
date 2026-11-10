import { FlavorsConfig, SelectedFlavor, SelectedAddon, Coupon, DwellMetric, CustomizationGroup, CustomerReview, QuantityAddonSelection } from '../types';

/**
 * Calculates the unit price of an item given base price, flavor configuration and addons.
 * Specifically handles multi-flavor rules such as Pizza GG (up to 3 flavors with highest price rule)
 * and quantity-based addons (+/- per additional item).
 */
export function calculateItemUnitPrice(
  basePrice: number,
  flavorsConfig?: FlavorsConfig,
  selectedFlavors: SelectedFlavor[] = [],
  selectedAddons: SelectedAddon[] = [],
  customGroups?: CustomizationGroup[],
  customSelections?: Record<string, { optionId: string; name: string; price: number }[]>,
  quantitySelections?: Record<string, QuantityAddonSelection[]>
): number {
  let calculatedFlavorAddition = 0;

  if (flavorsConfig && selectedFlavors.length > 0) {
    const deltas = selectedFlavors.map(f => f.priceDelta || 0);

    switch (flavorsConfig.pricingRule) {
      case 'highest': {
        calculatedFlavorAddition = Math.max(...deltas, 0);
        break;
      }
      case 'average': {
        const sum = deltas.reduce((acc, val) => acc + val, 0);
        calculatedFlavorAddition = Number((sum / selectedFlavors.length).toFixed(2));
        break;
      }
      case 'fixed_with_deltas':
      default: {
        calculatedFlavorAddition = deltas.reduce((acc, val) => acc + val, 0);
        break;
      }
    }
  }

  // Sum of all selected addon prices
  const addonsTotal = selectedAddons.reduce((acc, addon) => acc + (addon.price || 0), 0);

  // Additional custom groups calculation
  let customGroupsTotal = 0;
  if (customGroups) {
    customGroups.forEach(group => {
      if (group.type === 'quantity_addons') {
        const qList = (quantitySelections && quantitySelections[group.id]) || [];
        customGroupsTotal += qList.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0);
      } else if (customSelections) {
        const selections = customSelections[group.id] || [];
        if (selections.length === 0) return;

        if (group.type === 'flavors') {
          const prices = selections.map(s => s.price || 0);
          if (group.pricingRule === 'highest') {
            customGroupsTotal += Math.max(...prices, 0);
          } else if (group.pricingRule === 'average') {
            const sum = prices.reduce((a, b) => a + b, 0);
            customGroupsTotal += Number((sum / selections.length).toFixed(2));
          } else {
            customGroupsTotal += prices.reduce((a, b) => a + b, 0);
          }
        } else {
          // Standard addons / options
          customGroupsTotal += selections.reduce((sum, s) => sum + (s.price || 0), 0);
        }
      }
    });
  }

  const total = basePrice + calculatedFlavorAddition + addonsTotal + customGroupsTotal;
  return Number(Math.max(0, total).toFixed(2));
}

/**
 * Validates flavor selection against minimum and maximum constraints
 */
export function validateFlavorSelection(
  flavorsConfig: FlavorsConfig | undefined,
  selectedFlavors: SelectedFlavor[]
): { isValid: boolean; error?: string } {
  if (!flavorsConfig) {
    return { isValid: true };
  }

  const count = selectedFlavors.length;
  if (count < flavorsConfig.minFlavors) {
    return {
      isValid: false,
      error: `Selecione no mínimo ${flavorsConfig.minFlavors} sabor(es).`,
    };
  }

  if (count > flavorsConfig.maxFlavors) {
    return {
      isValid: false,
      error: `Você pode selecionar no máximo ${flavorsConfig.maxFlavors} sabores.`,
    };
  }

  return { isValid: true };
}

/**
 * Validates custom group selection constraints (min and max)
 */
export function validateGroupSelections(
  groups: CustomizationGroup[] = [],
  selections: Record<string, { optionId: string; name: string; price: number }[]> = {},
  quantitySelections: Record<string, QuantityAddonSelection[]> = {}
): { isValid: boolean; error?: string } {
  for (const group of groups) {
    if (group.type === 'quantity_addons') {
      const qList = quantitySelections[group.id] || [];
      const totalQty = qList.reduce((sum, item) => sum + (item.quantity || 0), 0);

      if (totalQty < group.min) {
        return {
          isValid: false,
          error: `"${group.name}": Selecione no mínimo ${group.min} item(ns). (Atual: ${totalQty})`,
        };
      }
      if (totalQty > group.max) {
        return {
          isValid: false,
          error: `"${group.name}": Selecione no máximo ${group.max} item(ns). (Atual: ${totalQty})`,
        };
      }

      if (group.maxPerOption) {
        for (const item of qList) {
          if (item.quantity > group.maxPerOption) {
            return {
              isValid: false,
              error: `"${item.name}": Limite de no máximo ${group.maxPerOption} unidade(s) por adicional.`,
            };
          }
        }
      }
    } else {
      const count = (selections[group.id] || []).length;
      if (count < group.min) {
        return {
          isValid: false,
          error: `"${group.name}": Selecione no mínimo ${group.min} opção(ões). (Atual: ${count})`,
        };
      }
      if (count > group.max) {
        return {
          isValid: false,
          error: `"${group.name}": Selecione no máximo ${group.max} opção(ões). (Atual: ${count})`,
        };
      }
    }
  }
  return { isValid: true };
}

/**
 * Calculates coupon discount amount based on subtotal and coupon rules
 */
export function calculateCouponDiscount(subtotal: number, coupon?: Coupon | null): number {
  if (!coupon || !coupon.active) return 0;
  if (subtotal < coupon.minOrderValue) return 0;

  if (coupon.discountType === 'percentage') {
    const discount = (subtotal * coupon.discountValue) / 100;
    return Number(Math.min(discount, subtotal).toFixed(2));
  } else {
    return Number(Math.min(coupon.discountValue, subtotal).toFixed(2));
  }
}

export interface DwellPerformance {
  productId: string;
  totalViewDurationSec: number;
  impressionCount: number;
  orderCount: number;
  avgDwellTimeSec: number;
  conversionRatePercent: number;
}

/**
 * Calculates dwell time metrics and conversion performance for feed analytics
 */
export function calculateDwellPerformance(metric: DwellMetric): DwellPerformance {
  const impressions = Math.max(1, metric.impressionCount);
  const avgDwell = metric.totalViewDurationSec / impressions;
  const convRate = (metric.orderCount / impressions) * 100;

  return {
    productId: metric.productId,
    totalViewDurationSec: metric.totalViewDurationSec,
    impressionCount: metric.impressionCount,
    orderCount: metric.orderCount,
    avgDwellTimeSec: Number(avgDwell.toFixed(1)),
    conversionRatePercent: Number(Math.min(100, convRate).toFixed(1)),
  };
}

/**
 * Calculates average rating and reviews stats
 */
export function calculateReviewsSummary(reviews: CustomerReview[]): {
  averageRating: number;
  totalReviews: number;
  ratingCounts: Record<number, number>;
} {
  if (!reviews || reviews.length === 0) {
    return { averageRating: 5.0, totalReviews: 0, ratingCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };
  }

  const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let sum = 0;

  reviews.forEach(r => {
    const star = Math.min(5, Math.max(1, Math.round(r.rating)));
    counts[star] = (counts[star] || 0) + 1;
    sum += r.rating;
  });

  return {
    averageRating: Number((sum / reviews.length).toFixed(1)),
    totalReviews: reviews.length,
    ratingCounts: counts,
  };
}
