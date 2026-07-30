'use client';

import { ShieldCheck, Clock, Headphones } from 'lucide-react';

/**
 * Barra inferior fija de confianza.
 * Diferencial de producto: visibilidad constante de los trust signals.
 * Prioridad alta - UX.
 */
export function TrustBar() {
  return (
    <div className="trust-bar">
      <div className="container-page flex flex-col items-center gap-2 py-3 sm:flex-row sm:justify-between">
        <div className="flex items-center gap-4 text-xs sm:text-sm">
          <div className="flex items-center gap-1.5 text-emerald-700">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span className="font-semibold">
              Pago protegido: sin acceso → 100% reembolso
            </span>
          </div>
          <div className="hidden items-center gap-1.5 text-gray-600 sm:flex">
            <Clock className="h-4 w-4 text-gray-500" />
            <span>Resolución disputas 24h</span>
          </div>
          <div className="hidden items-center gap-1.5 text-gray-600 sm:flex">
            <Headphones className="h-4 w-4 text-gray-500" />
            <span>Soporte en español</span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-600">
          <span className="badge bg-gray-50 text-gray-700 border border-gray-200">
            Paga con
          </span>
          <span className="font-semibold text-gray-800">Nequi</span>
          <span className="font-semibold text-gray-800">PSE</span>
          <span className="font-semibold text-gray-800">Daviplata</span>
          <span className="font-semibold text-gray-800">Tarjeta</span>
        </div>
      </div>
    </div>
  );
}
