import React, { useState, useMemo } from 'react';
import { Product, SelectedFlavor, SelectedAddon, CartItem, CustomOption, QuantityAddonSelection } from '../../types';
import { calculateItemUnitPrice, validateFlavorSelection, validateGroupSelections } from '../../utils/pricing';
import { X, Plus, Minus, Check, AlertCircle, Sparkles, Layers } from 'lucide-react';

interface Props {
  product: Product;
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
}

export const ItemCustomizerModal: React.FC<Props> = ({ product, onClose, onAddToCart }) => {
  // Legacy flavors
  const [selectedFlavors, setSelectedFlavors] = useState<SelectedFlavor[]>(() => {
    if (product.flavorsConfig && product.flavorsConfig.options.length > 0) {
      const first = product.flavorsConfig.options[0];
      return [{ flavorId: first.id, name: first.name, priceDelta: first.priceDelta }];
    }
    return [];
  });

  // Legacy addons
  const [selectedAddons, setSelectedAddons] = useState<SelectedAddon[]>([]);

  // Advanced customization groups (Type 1: selections)
  const [customSelections, setCustomSelections] = useState<Record<string, { optionId: string; name: string; price: number }[]>>(() => {
    const initial: Record<string, { optionId: string; name: string; price: number }[]> = {};
    if (product.customizationGroups) {
      product.customizationGroups.forEach(g => {
        if (g.type !== 'quantity_addons') {
          const defaults = g.options.filter(o => o.isDefault).map(o => ({
            optionId: o.id,
            name: o.name,
            price: o.price,
          }));
          if (defaults.length > 0) {
            initial[g.id] = defaults;
          } else if (g.min > 0 && g.options.length > 0 && g.max === 1) {
            initial[g.id] = [{ optionId: g.options[0].id, name: g.options[0].name, price: g.options[0].price }];
          } else {
            initial[g.id] = [];
          }
        }
      });
    }
    return initial;
  });

  // Advanced customization groups (Type 2: quantity addons with + and - buttons)
  const [quantitySelections, setQuantitySelections] = useState<Record<string, QuantityAddonSelection[]>>(() => {
    const initial: Record<string, QuantityAddonSelection[]> = {};
    if (product.customizationGroups) {
      product.customizationGroups.forEach(g => {
        if (g.type === 'quantity_addons') {
          initial[g.id] = [];
        }
      });
    }
    return initial;
  });

  const [notes, setNotes] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Flavor toggle (legacy)
  const toggleFlavor = (option: { id: string; name: string; priceDelta?: number }) => {
    if (!product.flavorsConfig) return;
    const isSelected = selectedFlavors.some(f => f.flavorId === option.id);

    if (isSelected) {
      if (selectedFlavors.length <= product.flavorsConfig.minFlavors) {
        setValidationError(`Mínimo de ${product.flavorsConfig.minFlavors} sabor(es) obrigatório.`);
        return;
      }
      setSelectedFlavors(prev => prev.filter(f => f.flavorId !== option.id));
      setValidationError(null);
    } else {
      if (selectedFlavors.length >= product.flavorsConfig.maxFlavors) {
        setValidationError(`Você já atingiu o limite de ${product.flavorsConfig.maxFlavors} sabores para este item.`);
        return;
      }
      setSelectedFlavors(prev => [
        ...prev,
        { flavorId: option.id, name: option.name, priceDelta: option.priceDelta },
      ]);
      setValidationError(null);
    }
  };

  // Addon toggle (legacy)
  const toggleAddon = (
    groupMax: number,
    groupItems: { id: string; name: string; price: number }[],
    addon: { id: string; name: string; price: number }
  ) => {
    const isSelected = selectedAddons.some(a => a.addonId === addon.id);

    if (isSelected) {
      setSelectedAddons(prev => prev.filter(a => a.addonId !== addon.id));
    } else {
      if (groupMax === 1) {
        const groupIds = new Set(groupItems.map(i => i.id));
        setSelectedAddons(prev => [
          ...prev.filter(a => !groupIds.has(a.addonId)),
          { addonId: addon.id, name: addon.name, price: addon.price },
        ]);
      } else {
        const currentCount = selectedAddons.filter(a => groupItems.some(i => i.id === a.addonId)).length;
        if (currentCount >= groupMax) {
          setValidationError(`Máximo de ${groupMax} opções permitidas neste grupo.`);
          return;
        }
        setSelectedAddons(prev => [
          ...prev,
          { addonId: addon.id, name: addon.name, price: addon.price },
        ]);
      }
    }
    setValidationError(null);
  };

  // Advanced group toggle (Type 1: Single/Multiple selection)
  const toggleCustomOption = (groupId: string, groupMin: number, groupMax: number, option: CustomOption) => {
    setCustomSelections(prev => {
      const current = prev[groupId] || [];
      const exists = current.some(item => item.optionId === option.id);

      if (exists) {
        if (current.length <= groupMin) {
          setValidationError(`Mínimo de ${groupMin} seleção(ões) necessária(s) neste grupo.`);
          return prev;
        }
        setValidationError(null);
        return {
          ...prev,
          [groupId]: current.filter(item => item.optionId !== option.id),
        };
      } else {
        if (groupMax === 1) {
          setValidationError(null);
          return {
            ...prev,
            [groupId]: [{ optionId: option.id, name: option.name, price: option.price }],
          };
        }
        if (current.length >= groupMax) {
          setValidationError(`Máximo de ${groupMax} seleção(ões) permitido(s) para este grupo.`);
          return prev;
        }
        setValidationError(null);
        return {
          ...prev,
          [groupId]: [...current, { optionId: option.id, name: option.name, price: option.price }],
        };
      }
    });
  };

  // Quantity Addon modifier (+ / - controls)
  const changeQuantityAddon = (
    groupId: string,
    groupMin: number,
    groupMax: number,
    maxPerOption: number | undefined,
    option: CustomOption,
    delta: number
  ) => {
    setQuantitySelections(prev => {
      const currentList = prev[groupId] || [];
      const existing = currentList.find(item => item.optionId === option.id);
      const currentQty = existing ? existing.quantity : 0;
      const nextQty = Math.max(0, currentQty + delta);

      // Total quantity across all options in this group
      const totalOtherQty = currentList
        .filter(item => item.optionId !== option.id)
        .reduce((sum, item) => sum + item.quantity, 0);
      const newTotal = totalOtherQty + nextQty;

      if (delta > 0) {
        if (newTotal > groupMax) {
          setValidationError(`Limite atingido: máximo de ${groupMax} adicionais para este grupo.`);
          return prev;
        }
        if (maxPerOption && nextQty > maxPerOption) {
          setValidationError(`Limite de até ${maxPerOption}x de "${option.name}".`);
          return prev;
        }
      }

      setValidationError(null);

      let updatedList: QuantityAddonSelection[];
      if (nextQty === 0) {
        updatedList = currentList.filter(item => item.optionId !== option.id);
      } else if (existing) {
        updatedList = currentList.map(item =>
          item.optionId === option.id ? { ...item, quantity: nextQty } : item
        );
      } else {
        updatedList = [
          ...currentList,
          {
            optionId: option.id,
            name: option.name,
            price: option.price,
            quantity: nextQty,
          },
        ];
      }

      return {
        ...prev,
        [groupId]: updatedList,
      };
    });
  };

  // Current Unit Price calculated dynamically
  const unitPrice = useMemo(() => {
    return calculateItemUnitPrice(
      product.price,
      product.flavorsConfig,
      selectedFlavors,
      selectedAddons,
      product.customizationGroups,
      customSelections,
      quantitySelections
    );
  }, [product, selectedFlavors, selectedAddons, customSelections, quantitySelections]);

  const totalPrice = Number((unitPrice * quantity).toFixed(2));

  const handleConfirm = () => {
    if (product.flavorsConfig) {
      const validation = validateFlavorSelection(product.flavorsConfig, selectedFlavors);
      if (!validation.isValid) {
        setValidationError(validation.error || 'Seleção inválida.');
        return;
      }
    }

    if (product.customizationGroups && product.customizationGroups.length > 0) {
      const groupValidation = validateGroupSelections(
        product.customizationGroups,
        customSelections,
        quantitySelections
      );
      if (!groupValidation.isValid) {
        setValidationError(groupValidation.error || 'Por favor, ajuste suas seleções.');
        return;
      }
    }

    const cartItem: CartItem = {
      cartItemId: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      productId: product.id,
      name: product.name,
      basePrice: product.price,
      finalUnitPrice: unitPrice,
      quantity,
      selectedFlavors: selectedFlavors.length > 0 ? selectedFlavors : undefined,
      selectedAddons: selectedAddons.length > 0 ? selectedAddons : undefined,
      customSelections: Object.keys(customSelections).length > 0 ? customSelections : undefined,
      quantitySelections: Object.keys(quantitySelections).length > 0 ? quantitySelections : undefined,
      notes: notes.trim() || undefined,
      mediaUrl: product.videoPoster || product.mediaUrl,
    };

    onAddToCart(cartItem);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4"
    >
      <div className="bg-white border border-neutral-200 w-full max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between bg-white shrink-0">
          <div className="pr-6">
            <h2 id="modal-title" className="text-lg font-black text-neutral-900 line-clamp-1">
              {product.name}
            </h2>
            <p className="text-xs text-neutral-600">
              Personalize sua escolha • Mesa confirmada
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar personalização"
            className="p-2 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 overflow-y-auto space-y-5 flex-1 text-sm text-neutral-800">
          {/* Banner image preview */}
          <div className="relative rounded-xl overflow-hidden h-36 bg-neutral-100 border border-neutral-200">
            <img
              src={product.videoPoster || product.mediaUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
            <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
              <span className="text-xs bg-red-600 text-white font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                {product.category}
              </span>
              <span className="text-base font-black text-white bg-black/75 px-2.5 py-1 rounded-lg backdrop-blur-sm">
                R$ {product.price.toFixed(2)} (base)
              </span>
            </div>
          </div>

          {/* Validation Alert */}
          {validationError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-300 text-red-700 text-xs font-bold flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Advanced Customization Groups */}
          {product.customizationGroups && product.customizationGroups.length > 0 && (
            <div className="space-y-4">
              {product.customizationGroups.map(group => {
                const isQuantityType = group.type === 'quantity_addons';

                if (isQuantityType) {
                  // Type 2: Quantity addons with + and - buttons
                  const groupSelections = quantitySelections[group.id] || [];
                  const totalSelectedQty = groupSelections.reduce((sum, item) => sum + item.quantity, 0);

                  return (
                    <div key={group.id} className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-black text-neutral-900 flex items-center gap-1.5 text-sm">
                            <Plus className="w-4 h-4 text-red-600" />
                            {group.name}
                          </h3>
                          <p className="text-xs text-neutral-600">
                            {group.min > 0 ? `Mínimo: ${group.min} • ` : ''}
                            Até {group.max} adicionais no total
                            {group.maxPerOption ? ` (Máx ${group.maxPerOption}x por item)` : ''}
                          </p>
                        </div>
                        <span
                          className={`text-xs font-black px-2.5 py-1 rounded-full border ${
                            totalSelectedQty >= group.min && totalSelectedQty <= group.max
                              ? 'bg-neutral-900 text-white border-neutral-900'
                              : 'bg-red-50 text-red-700 border-red-300'
                          }`}
                        >
                          {totalSelectedQty} / {group.max}
                        </span>
                      </div>

                      <div className="space-y-2 pt-1">
                        {group.options.map(option => {
                          const existingSelection = groupSelections.find(s => s.optionId === option.id);
                          const currentOptionQty = existingSelection ? existingSelection.quantity : 0;
                          const isMaxReached = totalSelectedQty >= group.max;
                          const isOptionMaxReached = group.maxPerOption ? currentOptionQty >= group.maxPerOption : false;

                          return (
                            <div
                              key={option.id}
                              className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                                currentOptionQty > 0
                                  ? 'bg-red-50/60 border-red-500 shadow-xs'
                                  : 'bg-white border-neutral-200 hover:border-neutral-300'
                              }`}
                            >
                              <div className="flex-1">
                                <div className="font-bold text-sm text-neutral-900 flex items-center gap-2">
                                  <span>{option.name}</span>
                                  {currentOptionQty > 0 && (
                                    <span className="text-[10px] bg-red-600 text-white font-extrabold px-1.5 py-0.2 rounded-full">
                                      {currentOptionQty}x
                                    </span>
                                  )}
                                </div>
                                {option.description && (
                                  <p className="text-xs text-neutral-500 mt-0.5">{option.description}</p>
                                )}
                                <div className="text-xs font-bold text-neutral-700 mt-1">
                                  {option.price > 0 ? (
                                    <span className="text-red-600 font-extrabold">+R$ {option.price.toFixed(2)}/un</span>
                                  ) : (
                                    <span className="text-green-600 font-semibold">Grátis</span>
                                  )}
                                </div>
                              </div>

                              {/* Quantity Stepper [ - ] [ count ] [ + ] */}
                              <div className="flex items-center gap-2 shrink-0 bg-white border border-neutral-200 rounded-xl p-1 shadow-xs">
                                <button
                                  type="button"
                                  onClick={() =>
                                    changeQuantityAddon(
                                      group.id,
                                      group.min,
                                      group.max,
                                      group.maxPerOption,
                                      option,
                                      -1
                                    )
                                  }
                                  disabled={currentOptionQty === 0}
                                  aria-label={`Diminuir ${option.name}`}
                                  className="w-8 h-8 rounded-lg bg-neutral-100 hover:bg-neutral-200 disabled:opacity-30 disabled:hover:bg-neutral-100 flex items-center justify-center font-bold text-neutral-800 transition-colors cursor-pointer"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>

                                <span className="w-6 text-center font-black text-sm text-neutral-900">
                                  {currentOptionQty}
                                </span>

                                <button
                                  type="button"
                                  onClick={() =>
                                    changeQuantityAddon(
                                      group.id,
                                      group.min,
                                      group.max,
                                      group.maxPerOption,
                                      option,
                                      1
                                    )
                                  }
                                  disabled={isMaxReached || isOptionMaxReached}
                                  aria-label={`Aumentar ${option.name}`}
                                  className="w-8 h-8 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-30 disabled:hover:bg-red-600 text-white flex items-center justify-center font-bold transition-colors cursor-pointer shadow-xs"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                // Type 1: Single/Multiple Selection (Checkboxes or Radios)
                const groupSelections = customSelections[group.id] || [];
                const isSingleChoice = group.max === 1;

                return (
                  <div key={group.id} className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-black text-neutral-900 flex items-center gap-1.5 text-sm">
                          <Layers className="w-4 h-4 text-red-600" />
                          {group.name}
                        </h3>
                        <p className="text-xs text-neutral-600">
                          {isSingleChoice
                            ? 'Escolha 1 opção'
                            : `Selecione de ${group.min} a ${group.max} opções`}
                          {group.pricingRule === 'highest' && ' (Preço pelo maior)'}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-black px-2.5 py-1 rounded-full border ${
                          groupSelections.length >= group.min && groupSelections.length <= group.max
                            ? 'bg-neutral-900 text-white border-neutral-900'
                            : 'bg-red-50 text-red-700 border-red-300'
                        }`}
                      >
                        {groupSelections.length} / {group.max}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-2 pt-1">
                      {group.options.map(option => {
                        const isChecked = groupSelections.some(s => s.optionId === option.id);
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => toggleCustomOption(group.id, group.min, group.max, option)}
                            aria-pressed={isChecked}
                            className={`w-full text-left p-3 rounded-xl border transition-all flex items-start justify-between gap-3 cursor-pointer ${
                              isChecked
                                ? 'bg-red-50/70 border-red-600 text-neutral-900 shadow-xs'
                                : 'bg-white border-neutral-200 text-neutral-800 hover:border-neutral-400'
                            }`}
                          >
                            <div className="flex items-start gap-2.5 flex-1">
                              <div
                                className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 border ${
                                  isChecked
                                    ? 'bg-red-600 border-red-600 text-white'
                                    : 'border-neutral-300 bg-white'
                                }`}
                              >
                                {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </div>
                              <div>
                                <div className="font-bold text-sm text-neutral-900">
                                  {option.name}
                                </div>
                                {option.description && (
                                  <p className="text-xs text-neutral-500 mt-0.5">
                                    {option.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              {option.price > 0 ? (
                                <span className="text-xs font-extrabold text-red-600">
                                  +R$ {option.price.toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-xs font-semibold text-green-600">Incluso</span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Legacy Multi-flavor Selection (e.g. Pizza GG) */}
          {product.flavorsConfig && !product.customizationGroups?.some(g => g.type === 'flavors') && (
            <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-neutral-900 flex items-center gap-1.5 text-sm">
                    <Sparkles className="w-4 h-4 text-red-600" />
                    Escolha os Sabores
                  </h3>
                  <p className="text-xs text-neutral-600">
                    Selecione de {product.flavorsConfig.minFlavors} até {product.flavorsConfig.maxFlavors} sabores
                    {product.flavorsConfig.pricingRule === 'highest' && ' (Maior valor da pizza)'}
                  </p>
                </div>
                <span className="text-xs font-black px-2.5 py-1 rounded-full bg-neutral-900 text-white">
                  {selectedFlavors.length} / {product.flavorsConfig.maxFlavors}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2 pt-1">
                {product.flavorsConfig.options.map(option => {
                  const isChecked = selectedFlavors.some(f => f.flavorId === option.id);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => toggleFlavor(option)}
                      aria-pressed={isChecked}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-start justify-between gap-3 cursor-pointer ${
                        isChecked
                          ? 'bg-red-50 border-red-600 text-neutral-900 shadow-xs'
                          : 'bg-white border-neutral-200 text-neutral-800 hover:border-neutral-400'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 flex-1">
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 border ${
                            isChecked
                              ? 'bg-red-600 border-red-600 text-white'
                              : 'border-neutral-300 bg-white'
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-neutral-900 flex items-center gap-2">
                            <span>{option.name}</span>
                            {option.isSpecial && (
                              <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.2 rounded font-bold">
                                Especial
                              </span>
                            )}
                          </div>
                          {option.description && (
                            <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">
                              {option.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {option.priceDelta && option.priceDelta > 0 ? (
                          <span className="text-xs font-extrabold text-red-600">
                            +R$ {option.priceDelta.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-green-600">Incluso</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Legacy Addon Groups */}
          {product.addonGroups && !product.customizationGroups &&
            product.addonGroups.map(group => {
              return (
                <div key={group.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-black text-neutral-900 text-sm">{group.name}</h4>
                      <p className="text-xs text-neutral-600">
                        {group.max === 1 ? 'Escolha 1 opção' : `Escolha até ${group.max} opções`}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    {group.items.map(addon => {
                      const isSelected = selectedAddons.some(a => a.addonId === addon.id);
                      return (
                        <button
                          key={addon.id}
                          type="button"
                          onClick={() => toggleAddon(group.max, group.items, addon)}
                          aria-pressed={isSelected}
                          className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-red-50 border-red-600 text-neutral-900'
                              : 'bg-white border-neutral-200 text-neutral-800 hover:border-neutral-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                                isSelected
                                  ? 'bg-red-600 border-red-600 text-white'
                                  : 'border-neutral-300 bg-white'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span className="text-xs font-bold text-neutral-900">{addon.name}</span>
                          </div>
                          <span className="text-xs font-extrabold text-red-600">
                            +R$ {addon.price.toFixed(2)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

          {/* Observações do Cliente */}
          <div className="space-y-1.5">
            <label htmlFor="notes-input" className="font-bold text-xs text-neutral-700 block">
              Observações para a Cozinha (Opcional):
            </label>
            <textarea
              id="notes-input"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ex: Sem cebola, massa bem crocante, molho à parte..."
              rows={2}
              className="w-full p-3 rounded-xl border border-neutral-300 focus:outline-none focus:border-red-600 text-xs bg-neutral-50 text-neutral-900 placeholder-neutral-400"
            />
          </div>
        </div>

        {/* Footer Bar with Quantity and Add Button */}
        <div className="p-4 border-t border-neutral-200 bg-white flex items-center justify-between gap-4 shrink-0">
          {/* Quantity Controls */}
          <div className="flex items-center gap-2 bg-neutral-100 rounded-xl p-1 border border-neutral-200">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              aria-label="Diminuir quantidade"
              className="w-9 h-9 rounded-lg bg-white flex items-center justify-center text-neutral-800 disabled:opacity-40 shadow-xs hover:bg-neutral-50 transition-colors cursor-pointer"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-7 text-center font-black text-sm text-neutral-900">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity(quantity + 1)}
              aria-label="Aumentar quantidade"
              className="w-9 h-9 rounded-lg bg-white flex items-center justify-center text-neutral-800 shadow-xs hover:bg-neutral-50 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add Button */}
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black py-3 px-4 rounded-xl flex items-center justify-between shadow-md active:scale-98 transition-all cursor-pointer"
          >
            <span>Adicionar ao Carrinho</span>
            <span className="text-base font-extrabold bg-black/20 px-2 py-0.5 rounded-lg">
              R$ {totalPrice.toFixed(2)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
