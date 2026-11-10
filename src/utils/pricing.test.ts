import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateItemUnitPrice,
  validateFlavorSelection,
  validateGroupSelections,
  calculateCouponDiscount,
  calculateDwellPerformance,
  calculateReviewsSummary,
} from './pricing';
import { FlavorsConfig, Coupon, DwellMetric, CustomizationGroup, CustomerReview } from '../types';

test('calculateItemUnitPrice: calculates pizza GG with highest flavor price rule', () => {
  const pizzaConfig: FlavorsConfig = {
    minFlavors: 1,
    maxFlavors: 3,
    pricingRule: 'highest',
    options: [
      { id: 'f1', name: 'Mussarela', priceDelta: 0 },
      { id: 'f2', name: 'Calabresa Especial', priceDelta: 6 },
      { id: 'f3', name: 'Camarão Catupiry', priceDelta: 18 },
    ],
  };

  const basePrice = 65.0; // Pizza GG base price

  const selectedFlavors = [
    { flavorId: 'f1', name: 'Mussarela', priceDelta: 0 },
    { flavorId: 'f2', name: 'Calabresa Especial', priceDelta: 6 },
    { flavorId: 'f3', name: 'Camarão Catupiry', priceDelta: 18 },
  ];

  const price = calculateItemUnitPrice(basePrice, pizzaConfig, selectedFlavors, []);
  assert.equal(price, 83.0);
});

test('calculateItemUnitPrice: calculates with custom multi-flavor groups', () => {
  const customGroups: CustomizationGroup[] = [
    {
      id: 'grp_flavors',
      name: 'Sabores Especiais',
      type: 'flavors',
      min: 1,
      max: 2,
      pricingRule: 'highest',
      options: [
        { id: 's1', name: 'Trufada', price: 15 },
        { id: 's2', name: 'Parma', price: 20 },
      ],
    },
    {
      id: 'grp_crust',
      name: 'Borda',
      type: 'options',
      min: 1,
      max: 1,
      options: [{ id: 'b1', name: 'Catupiry', price: 12 }],
    },
  ];

  const selections = {
    grp_flavors: [
      { optionId: 's1', name: 'Trufada', price: 15 },
      { optionId: 's2', name: 'Parma', price: 20 },
    ],
    grp_crust: [{ optionId: 'b1', name: 'Catupiry', price: 12 }],
  };

  // Base 60 + highest flavor (20) + borda (12) = 92
  const price = calculateItemUnitPrice(60, undefined, [], [], customGroups, selections);
  assert.equal(price, 92.0);
});

test('validateGroupSelections: enforces min and max selection limits for groups', () => {
  const groups: CustomizationGroup[] = [
    {
      id: 'grp_ponto',
      name: 'Ponto da Carne',
      type: 'options',
      min: 1,
      max: 1,
      options: [],
    },
    {
      id: 'grp_extras',
      name: 'Molhos Extras',
      type: 'addons',
      min: 0,
      max: 2,
      options: [],
    },
  ];

  // Missing required group 'grp_ponto'
  const missing = validateGroupSelections(groups, { grp_ponto: [] });
  assert.equal(missing.isValid, false);
  assert.match(missing.error || '', /no mínimo 1/);

  // Exceeding maximum for 'grp_extras' (3 selected when max is 2)
  const exceeded = validateGroupSelections(groups, {
    grp_ponto: [{ optionId: 'p1', name: 'Ao Ponto', price: 0 }],
    grp_extras: [
      { optionId: 'e1', name: 'Maionese', price: 3 },
      { optionId: 'e2', name: 'Barbecue', price: 3 },
      { optionId: 'e3', name: 'Cheddar', price: 4 },
    ],
  });
  assert.equal(exceeded.isValid, false);
  assert.match(exceeded.error || '', /no máximo 2/);

  // Valid selection
  const valid = validateGroupSelections(groups, {
    grp_ponto: [{ optionId: 'p1', name: 'Ao Ponto', price: 0 }],
    grp_extras: [{ optionId: 'e1', name: 'Maionese', price: 3 }],
  });
  assert.equal(valid.isValid, true);
});

test('calculateReviewsSummary: aggregates average rating and total counts correctly', () => {
  const reviews: CustomerReview[] = [
    {
      id: 'r1',
      restaurantId: 'rest_1',
      productId: 'p1',
      productName: 'Pizza GG',
      tableId: 't1',
      tableName: 'Mesa 01',
      rating: 5,
      comment: 'Massa incrível e borda super recheada!',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'r2',
      restaurantId: 'rest_1',
      productId: 'p1',
      productName: 'Pizza GG',
      tableId: 't2',
      tableName: 'Mesa 02',
      rating: 4,
      comment: 'Muito boa, demorou só um pouquinho.',
      createdAt: new Date().toISOString(),
    },
  ];

  const summary = calculateReviewsSummary(reviews);
  assert.equal(summary.totalReviews, 2);
  assert.equal(summary.averageRating, 4.5);
  assert.equal(summary.ratingCounts[5], 1);
  assert.equal(summary.ratingCounts[4], 1);
});

test('calculateItemUnitPrice: calculates with Type 2 quantity_addons (+ / -)', () => {
  const customGroups: CustomizationGroup[] = [
    {
      id: 'grp_addons_qtd',
      name: 'Adicionais com Quantidade',
      type: 'quantity_addons',
      min: 0,
      max: 5,
      maxPerOption: 2,
      options: [
        { id: 'bacon', name: 'Bacon', price: 6.0 },
        { id: 'queijo', name: 'Queijo', price: 5.0 },
      ],
    },
  ];

  const quantitySelections = {
    grp_addons_qtd: [
      { optionId: 'bacon', name: 'Bacon', price: 6.0, quantity: 2 }, // 2 * 6 = 12
      { optionId: 'queijo', name: 'Queijo', price: 5.0, quantity: 1 }, // 1 * 5 = 5
    ],
  };

  // Base 50 + 12 + 5 = 67
  const price = calculateItemUnitPrice(50, undefined, [], [], customGroups, undefined, quantitySelections);
  assert.equal(price, 67.0);
});

test('validateGroupSelections: enforces quantity_addons max and maxPerOption limits', () => {
  const groups: CustomizationGroup[] = [
    {
      id: 'grp_extras',
      name: 'Extras',
      type: 'quantity_addons',
      min: 1,
      max: 4,
      maxPerOption: 2,
      options: [],
    },
  ];

  // Under minimum (0 items when min is 1)
  const underMin = validateGroupSelections(groups, {}, { grp_extras: [] });
  assert.equal(underMin.isValid, false);
  assert.match(underMin.error || '', /no mínimo 1/);

  // Exceeds maxPerOption (3 of same item when maxPerOption is 2)
  const exceedsPerItem = validateGroupSelections(
    groups,
    {},
    {
      grp_extras: [{ optionId: 'bacon', name: 'Bacon', price: 5, quantity: 3 }],
    }
  );
  assert.equal(exceedsPerItem.isValid, false);
  assert.match(exceedsPerItem.error || '', /no máximo 2 unidade/);

  // Exceeds group max (5 items total when max is 4)
  const exceedsGroupMax = validateGroupSelections(
    groups,
    {},
    {
      grp_extras: [
        { optionId: 'bacon', name: 'Bacon', price: 5, quantity: 2 },
        { optionId: 'queijo', name: 'Queijo', price: 4, quantity: 2 },
        { optionId: 'molho', name: 'Molho', price: 3, quantity: 1 },
      ],
    }
  );
  assert.equal(exceedsGroupMax.isValid, false);
  assert.match(exceedsGroupMax.error || '', /no máximo 4 item/);

  // Valid
  const valid = validateGroupSelections(
    groups,
    {},
    {
      grp_extras: [
        { optionId: 'bacon', name: 'Bacon', price: 5, quantity: 2 },
        { optionId: 'queijo', name: 'Queijo', price: 4, quantity: 1 },
      ],
    }
  );
  assert.equal(valid.isValid, true);
});

