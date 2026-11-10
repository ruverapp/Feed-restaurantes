import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Table, Restaurant } from '../../types';
import { X, Printer, Download, ExternalLink } from 'lucide-react';

interface Props {
  table: Table;
  restaurant: Restaurant;
  onClose: () => void;
  onSimulateTable: (tableId: string) => void;
}

export const TableQrModal: React.FC<Props> = ({ table, restaurant, onClose, onSimulateTable }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const tableUrl = `${window.location.origin}?store=${restaurant.slug}&mesa=${table.number}`;

  useEffect(() => {
    QRCode.toDataURL(tableUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error(err));
  }, [tableUrl]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div className="bg-white border border-neutral-300 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl relative text-center text-neutral-900">
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-4 right-4 p-2 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div>
          <span className="text-[11px] font-black uppercase tracking-wider text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
            Display de Mesa em Acrílico
          </span>
          <h3 className="text-xl font-black text-neutral-900 mt-2">
            {table.label}
          </h3>
          <p className="text-xs text-neutral-600 mt-0.5">
            {restaurant.name}
          </p>
        </div>

        {/* Printable Card Frame */}
        <div id="printable-table-card" className="bg-white text-black p-5 rounded-2xl border-2 border-neutral-200 shadow-sm space-y-3 mx-auto">
          <div className="flex items-center justify-center gap-2 border-b border-neutral-200 pb-2">
            <img src={restaurant.logo} alt="" className="w-8 h-8 rounded-full object-cover border border-red-600" />
            <span className="font-black text-sm tracking-tight text-neutral-900">{restaurant.name}</span>
          </div>

          <div className="py-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-red-600">
              CARDÁPIO REELS DIGITAL
            </span>
            <div className="text-2xl font-black tracking-tight text-neutral-900">
              MESA {table.number}
            </div>
          </div>

          {qrDataUrl ? (
            <div className="flex justify-center p-2 bg-neutral-50 rounded-xl border border-neutral-200">
              <img src={qrDataUrl} alt={`QR Code para Mesa ${table.number}`} className="w-48 h-48" />
            </div>
          ) : (
            <div className="w-48 h-48 mx-auto flex items-center justify-center bg-neutral-100 rounded-xl text-neutral-500 text-xs">
              Gerando QR Code...
            </div>
          )}

          <p className="text-[11px] text-neutral-600 font-semibold leading-tight">
            Aponte a câmera do seu celular para abrir o cardápio e fazer pedidos direto na mesa sem login.
          </p>
        </div>

        {/* Action Controls */}
        <div className="space-y-2 pt-2">
          <button
            type="button"
            onClick={() => onSimulateTable(table.id)}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-black text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Simular Cliente Sentando Nesta Mesa</span>
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir</span>
            </button>
            <a
              href={qrDataUrl}
              download={`qrcode_mesa_${table.number}.png`}
              className="flex-1 bg-neutral-900 hover:bg-black text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Baixar PNG</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
