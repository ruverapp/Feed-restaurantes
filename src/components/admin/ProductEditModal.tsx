import React, { useState } from 'react';
import { Product, PricingRule, FlavorOption, CustomizationGroup, CustomOption } from '../../types';
import { X, Plus, Trash2, Video, Image as ImageIcon, Sparkles, Layers, Check } from 'lucide-react';

interface Props {
  product?: Product | null;
  restaurantId: string;
  onClose: () => void;
  onSave: (productData: any) => void;
}

export const ProductEditModal: React.FC<Props> = ({
  product,
  restaurantId,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(product?.name || '');
  const [category, setCategory] = useState(product?.category || 'Pizzas Especiais');
  const [description, setDescription] = useState(product?.description || '');
  const [price, setPrice] = useState(product?.price ? product.price.toString() : '59.90');
  const [mediaType, setMediaType] = useState<'video' | 'image'>(product?.mediaType || 'video');
  const [mediaUrl, setMediaUrl] = useState(product?.mediaUrl || 'https://assets.mixkit.co/videos/preview/mixkit-top-view-of-a-delicious-pizza-42867-large.mp4');
  const [videoPoster, setVideoPoster] = useState(product?.videoPoster || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80');
  const [inStock, setInStock] = useState(product?.inStock !== false);
  const [stockCount, setStockCount] = useState(product?.stockCount ? product.stockCount.toString() : '30');
  const [preparationTimeMin, setPreparationTimeMin] = useState(product?.preparationTimeMin ? product.preparationTimeMin.toString() : '20');

  // Multi-flavor setup (e.g. Pizza GG - up to 3 flavors with highest price rule)
  const [hasFlavors, setHasFlavors] = useState(!!product?.flavorsConfig);
  const [minFlavors, setMinFlavors] = useState(product?.flavorsConfig?.minFlavors?.toString() || '1');
  const [maxFlavors, setMaxFlavors] = useState(product?.flavorsConfig?.maxFlavors?.toString() || '3');
  const [pricingRule, setPricingRule] = useState<PricingRule>(product?.flavorsConfig?.pricingRule || 'highest');
  const [flavorsList, setFlavorsList] = useState<FlavorOption[]>(
    product?.flavorsConfig?.options || [
      { id: 'f1', name: 'Mussarela Especial', priceDelta: 0 },
      { id: 'f2', name: 'Calabresa Artesanal', priceDelta: 4 },
      { id: 'f3', name: 'Quatro Queijos Prime', priceDelta: 8 },
    ]
  );

  const [newFlavorName, setNewFlavorName] = useState('');
  const [newFlavorDelta, setNewFlavorDelta] = useState('0');

  // Customization groups (e.g. Bordas, Extras, Adicionais com limites)
  const [customGroups, setCustomGroups] = useState<CustomizationGroup[]>(
    product?.customizationGroups || [
      {
        id: 'grp_bordas',
        name: 'Borda Recheada',
        type: 'addons',
        min: 0,
        max: 1,
        options: [
          { id: 'b1', name: 'Borda Catupiry Original', price: 12.0 },
          { id: 'b2', name: 'Borda Cheddar Cremoso', price: 10.0 },
          { id: 'b3', name: 'Borda Chocolate com Morango', price: 14.0 },
        ],
      },
    ]
  );

  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupMin, setNewGroupMin] = useState('0');
  const [newGroupMax, setNewGroupMax] = useState('1');
  const [newGroupType, setNewGroupType] = useState<'flavors' | 'addons' | 'options'>('addons');

  // Handle flavor actions
  const handleAddFlavor = () => {
    if (!newFlavorName.trim()) return;
    setFlavorsList(prev => [
      ...prev,
      {
        id: `flav_${Date.now()}`,
        name: newFlavorName.trim(),
        priceDelta: parseFloat(newFlavorDelta) || 0,
      },
    ]);
    setNewFlavorName('');
    setNewFlavorDelta('0');
  };

  const handleRemoveFlavor = (id: string) => {
    setFlavorsList(prev => prev.filter(f => f.id !== id));
  };

  // Handle customization groups actions
  const handleAddGroup = () => {
    if (!newGroupName.trim()) return;
    const newGroup: CustomizationGroup = {
      id: `grp_${Date.now()}`,
      name: newGroupName.trim(),
      type: newGroupType,
      min: parseInt(newGroupMin, 10) || 0,
      max: parseInt(newGroupMax, 10) || 1,
      options: [
        { id: `opt_${Date.now()}_1`, name: 'Opção 1', price: 0 },
      ],
    };
    setCustomGroups(prev => [...prev, newGroup]);
    setNewGroupName('');
  };

  const handleRemoveGroup = (groupId: string) => {
    setCustomGroups(prev => prev.filter(g => g.id !== groupId));
  };

  const handleAddOptionToGroup = (groupId: string, optName: string, optPrice: number) => {
    if (!optName.trim()) return;
    setCustomGroups(prev =>
      prev.map(g => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          options: [
            ...g.options,
            { id: `opt_${Date.now()}`, name: optName.trim(), price: optPrice },
          ],
        };
      })
    );
  };

  const handleRemoveOptionFromGroup = (groupId: string, optionId: string) => {
    setCustomGroups(prev =>
      prev.map(g => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          options: g.options.filter(o => o.id !== optionId),
        };
      })
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const parsedPrice = parseFloat(price) || 0;
    const parsedStock = parseInt(stockCount, 10) || 0;
    const parsedPrep = parseInt(preparationTimeMin, 10) || 15;

    const data: any = {
      restaurantId,
      name: name.trim(),
      category: category.trim(),
      description: description.trim(),
      price: parsedPrice,
      mediaType,
      mediaUrl: mediaUrl.trim(),
      videoPoster: videoPoster.trim(),
      inStock,
      stockCount: parsedStock,
      preparationTimeMin: parsedPrep,
      isHighlight: true,
      customizationGroups: customGroups.length > 0 ? customGroups : undefined,
    };

    if (hasFlavors && flavorsList.length > 0) {
      data.flavorsConfig = {
        minFlavors: parseInt(minFlavors, 10) || 1,
        maxFlavors: parseInt(maxFlavors, 10) || 3,
        pricingRule,
        options: flavorsList,
      };
    } else {
      data.flavorsConfig = undefined;
    }

    onSave(data);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto"
    >
      <div className="bg-white border border-neutral-300 rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto text-neutral-900">
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between sticky top-0 bg-white z-10 shrink-0">
          <div>
            <h3 className="font-black text-base text-neutral-900">
              {product ? 'Editar Prato / Cardápio' : 'Novo Item com Personalizações'}
            </h3>
            <p className="text-xs text-neutral-500">Configure regras de preços, sabores e grupos com limites</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="p-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-neutral-800">Nome do Item *</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: Pizza Família GG"
                className="w-full bg-neutral-50 border border-neutral-300 rounded-xl p-2.5 text-neutral-900 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-neutral-800">Categoria *</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-300 rounded-xl p-2.5 text-neutral-900 focus:outline-none focus:border-red-600"
              >
                <option value="Pizzas Especiais">Pizzas Especiais</option>
                <option value="Massas Frescas">Massas Frescas</option>
                <option value="Burgers Especiais">Burgers Especiais</option>
                <option value="Entradas">Entradas</option>
                <option value="Sobremesas">Sobremesas</option>
                <option value="Bebidas & Drinks">Bebidas & Drinks</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-neutral-800">Descrição Apetite</label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Descreva os ingredientes, ponto da carne ou segredo do chef..."
              className="w-full bg-neutral-50 border border-neutral-300 rounded-xl p-2.5 text-neutral-900 focus:outline-none focus:border-red-600"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-neutral-800">Preço Base (R$) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={price}
                onChange={e => setPrice(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-300 rounded-xl p-2.5 text-neutral-900 focus:outline-none focus:border-red-600"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-neutral-800">Estoque (Qtd)</label>
              <input
                type="number"
                value={stockCount}
                onChange={e => setStockCount(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-300 rounded-xl p-2.5 text-neutral-900 focus:outline-none focus:border-red-600"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-neutral-800">Preparo (min)</label>
              <input
                type="number"
                value={preparationTimeMin}
                onChange={e => setPreparationTimeMin(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-300 rounded-xl p-2.5 text-neutral-900 focus:outline-none focus:border-red-600"
              />
            </div>
          </div>

          {/* Media Setup for Reels */}
          <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-neutral-900 flex items-center gap-1.5">
                <Video className="w-4 h-4 text-red-600" />
                Mídia do Feed Reels
              </h4>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setMediaType('video')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer ${
                    mediaType === 'video' ? 'bg-red-600 text-white' : 'bg-neutral-200 text-neutral-700'
                  }`}
                >
                  <Video className="w-3 h-3" />
                  Vídeo (MP4 Loop)
                </button>
                <button
                  type="button"
                  onClick={() => setMediaType('image')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer ${
                    mediaType === 'image' ? 'bg-red-600 text-white' : 'bg-neutral-200 text-neutral-700'
                  }`}
                >
                  <ImageIcon className="w-3 h-3" />
                  Foto
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <input
                type="url"
                required
                value={mediaUrl}
                onChange={e => setMediaUrl(e.target.value)}
                placeholder="URL da mídia (ex: https://.../video.mp4)"
                className="w-full bg-white border border-neutral-300 rounded-xl p-2 text-neutral-900 font-mono text-[11px]"
              />
              <input
                type="url"
                value={videoPoster}
                onChange={e => setVideoPoster(e.target.value)}
                placeholder="URL da capa / thumbnail (imagem estática)"
                className="w-full bg-white border border-neutral-300 rounded-xl p-2 text-neutral-900 font-mono text-[11px]"
              />
            </div>
          </div>

          {/* Multi-flavor / Limited Flavors Section */}
          <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-black text-neutral-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-red-600" />
                  Multi-Sabores Limitados (Ex: Pizza GG até 3 sabores)
                </h4>
                <p className="text-[11px] text-neutral-600">
                  Defina limites de sabores e regra de precificação variável (maior valor, média ou soma)
                </p>
              </div>
              <input
                type="checkbox"
                id="toggle-flavors"
                checked={hasFlavors}
                onChange={e => setHasFlavors(e.target.checked)}
                className="w-4 h-4 accent-red-600 cursor-pointer"
              />
            </div>

            {hasFlavors && (
              <div className="space-y-3 pt-2 border-t border-neutral-200">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-neutral-700">Mín. Sabores</label>
                    <input
                      type="number"
                      min="1"
                      value={minFlavors}
                      onChange={e => setMinFlavors(e.target.value)}
                      className="w-full bg-white border border-neutral-300 rounded-xl p-2 text-neutral-900 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-neutral-700">Máx. Sabores Permitidos</label>
                    <input
                      type="number"
                      min="1"
                      value={maxFlavors}
                      onChange={e => setMaxFlavors(e.target.value)}
                      className="w-full bg-white border border-neutral-300 rounded-xl p-2 text-neutral-900 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-neutral-700">Regra de Cobrança</label>
                    <select
                      value={pricingRule}
                      onChange={e => setPricingRule(e.target.value as any)}
                      className="w-full bg-white border border-neutral-300 rounded-xl p-2 text-neutral-900 font-bold"
                    >
                      <option value="highest">Cobrar pelo Maior Valor</option>
                      <option value="average">Média dos Sabores</option>
                      <option value="fixed_with_deltas">Soma de Taxas Adicionais</option>
                    </select>
                  </div>
                </div>

                {/* Flavors list */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-neutral-800">Sabores Cadastrados:</span>
                  <div className="max-h-36 overflow-y-auto space-y-1">
                    {flavorsList.map(flavor => (
                      <div
                        key={flavor.id}
                        className="flex items-center justify-between bg-white border border-neutral-200 p-2 rounded-lg"
                      >
                        <span className="font-bold text-neutral-900">{flavor.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-red-600 font-bold">
                            {flavor.priceDelta && flavor.priceDelta > 0
                              ? `+R$ ${flavor.priceDelta.toFixed(2)}`
                              : 'Sem adicional'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFlavor(flavor.id)}
                            className="text-neutral-400 hover:text-red-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Flavor row */}
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Nome do sabor (ex: Camarão Catupiry)"
                      value={newFlavorName}
                      onChange={e => setNewFlavorName(e.target.value)}
                      className="flex-1 bg-white border border-neutral-300 rounded-lg p-2 text-neutral-900"
                    />
                    <input
                      type="number"
                      step="0.5"
                      placeholder="+R$"
                      value={newFlavorDelta}
                      onChange={e => setNewFlavorDelta(e.target.value)}
                      className="w-20 bg-white border border-neutral-300 rounded-lg p-2 text-neutral-900"
                    />
                    <button
                      type="button"
                      onClick={handleAddFlavor}
                      className="bg-neutral-900 hover:bg-black text-white font-bold px-3 rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Advanced Customization Groups Section (Limitações de opções) */}
          <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-black text-neutral-900 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-red-600" />
                  Grupos de Customização & Limitações
                </h4>
                <p className="text-[11px] text-neutral-600">
                  Crie grupos opcionais ou obrigatórios com limites mínimos e máximos (ex: Bordas, Ponto da Carne, Extras)
                </p>
              </div>
            </div>

            {/* List of groups */}
            <div className="space-y-3">
              {customGroups.map(grp => (
                <div key={grp.id} className="bg-white border border-neutral-300 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                    <div>
                      <span className="font-black text-neutral-900">{grp.name}</span>
                      <span className="text-[11px] text-neutral-500 ml-2">
                        (Mín: {grp.min} | Máx: {grp.max})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveGroup(grp.id)}
                      className="text-neutral-400 hover:text-red-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    {grp.options.map(opt => (
                      <div key={opt.id} className="flex justify-between items-center text-[11px] bg-neutral-50 px-2 py-1 rounded">
                        <span>{opt.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-red-600">
                            {opt.price > 0 ? `+R$ ${opt.price.toFixed(2)}` : 'Grátis'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveOptionFromGroup(grp.id, opt.id)}
                            className="text-neutral-400 hover:text-red-600 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Add New Group input */}
            <div className="bg-white border border-neutral-200 rounded-xl p-3 space-y-2">
              <span className="font-bold text-neutral-800 text-[11px]">Adicionar Novo Grupo de Opções:</span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <input
                  type="text"
                  placeholder="Nome do Grupo (ex: Borda Recheada)"
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  className="sm:col-span-2 bg-neutral-50 border border-neutral-300 rounded-lg p-2 text-neutral-900"
                />
                <div className="flex gap-1">
                  <input
                    type="number"
                    min="0"
                    placeholder="Mín"
                    value={newGroupMin}
                    onChange={e => setNewGroupMin(e.target.value)}
                    className="w-1/2 bg-neutral-50 border border-neutral-300 rounded-lg p-2 text-neutral-900"
                  />
                  <input
                    type="number"
                    min="1"
                    placeholder="Máx"
                    value={newGroupMax}
                    onChange={e => setNewGroupMax(e.target.value)}
                    className="w-1/2 bg-neutral-50 border border-neutral-300 rounded-lg p-2 text-neutral-900"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddGroup}
                  className="bg-neutral-900 hover:bg-black text-white font-bold px-3 py-2 rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Criar Grupo
                </button>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-3 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold py-3 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black py-3 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
            >
              Salvar Item no Cardápio
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
