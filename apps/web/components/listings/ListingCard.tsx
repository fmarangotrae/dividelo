'use client';

import Link from 'next/link';
import { BadgeCheck, ShieldCheck, Users, Clock, Star, ArrowRight } from 'lucide-react';
import { cn, formatCOP } from '@/lib/utils';

type Listing = {
  id: string;
  status: string;
  planName: string;
  totalSlots: number;
  availableSlots: number;
  baseSlotPriceCOP: number | string;
  markupPercent: number;
  guestPricePreviewCOP?: number;
  savingsPercent?: number;
  createdAt: string;
  subscriptionService: {
    id: string;
    name: string;
    category: string;
    logoUrl?: string | null;
  };
  host: {
    id: string;
    name?: string | null;
    reputationScore: number;
    kyc?: { status?: string } | null;
  };
};

export function ListingCard({ listing }: { listing: Listing }) {
  const price = listing.guestPricePreviewCOP
    ? formatCOP(listing.guestPricePreviewCOP)
    : formatCOP(Number(listing.baseSlotPriceCOP));

  const savings = Math.round((listing.savingsPercent ?? 0) * 100);
  const kycVerified = listing.host.kyc?.status === 'VERIFIED';
  const score = listing.host.reputationScore ?? 50;
  const scoreColor =
    score >= 85
      ? 'bg-emerald-500'
      : score >= 65
      ? 'bg-amber-500'
      : 'bg-gray-400';

  const occupied = listing.totalSlots - listing.availableSlots;

  return (
    <Link
      href={`/listing/${listing.id}`}
      className="group card relative flex flex-col p-5 transition-all hover:-translate-y-1 hover:shadow-hover"
    >
      {/* Badge ahorro */}
      {savings > 0 && (
        <div className="absolute right-4 top-4 badge bg-brand-500 text-white">
          -{savings}% vs individual
        </div>
      )}

      {/* Servicio */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-gray-400">
            {listing.subscriptionService.category.replace('_', ' ')}
          </div>
          <h3 className="mt-1 text-lg font-bold text-gray-900">
            {listing.subscriptionService.name}
          </h3>
          <p className="text-xs text-gray-500">{listing.planName}</p>
        </div>
        <div
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-2xl font-extrabold text-white',
            scoreColor,
          )}
          style={{ fontSize: 14 }}
        >
          {listing.subscriptionService.name.charAt(0)}
        </div>
      </div>

      {/* Cupos */}
      <div className="mt-4 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-gray-600">
          <Users className="h-3.5 w-3.5" />
          {listing.availableSlots} disponibles · {listing.totalSlots} totales
        </div>
        <div className="flex items-center gap-1 text-gray-400">
          <Clock className="h-3.5 w-3.5" />
          Mensual
        </div>
      </div>

      {/* Barra ocupación */}
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600"
          style={{ width: `${(occupied / listing.totalSlots) * 100}%` }}
        />
      </div>

      {/* Host info */}
      <div className="mt-4 flex items-center gap-2 text-xs">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 font-bold text-gray-700">
          {listing.host.name?.charAt(0) ?? '?'}
        </div>
        <div className="min-w-0">
          <div className="truncate font-semibold text-gray-800">
            {listing.host.name ?? 'Anfitrión'}
          </div>
          <div className="flex items-center gap-1 text-gray-500">
            <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
            Score {listing.host.reputationScore}
            {kycVerified && (
              <>
                <span>·</span>
                <BadgeCheck className="h-3 w-3 text-emerald-600" />
                <span className="text-emerald-700">Verificado</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Precio + CTA */}
      <div className="mt-5 flex items-end justify-between border-t border-gray-100 pt-4">
        <div>
          <div className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
            Precio huésped / mes
          </div>
          <div className="text-2xl font-extrabold tracking-tight text-gray-900">{price}</div>
          <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
            <ShieldCheck className="h-3 w-3" />
            Protegido
          </div>
        </div>
        <div className="inline-flex items-center gap-1 rounded-full bg-gray-900 px-4 py-2 text-xs font-semibold text-white transition group-hover:bg-brand-500">
          Ver plaza <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  );
}
