import Link from 'next/link';
import { Search, SlidersHorizontal, Grid3X3, ChevronLeft, ChevronRight, Filter, CheckCircle2, BadgeCheck } from 'lucide-react';
import { ListingCard } from '@/components/listings/ListingCard';
import { apiFetch } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const FILTERS_CATEGORY = [
  { key: 'ALL', label: 'Todas' },
  { key: 'STREAMING_VIDEO', label: 'Video' },
  { key: 'STREAMING_MUSIC', label: 'Música' },
  { key: 'GAMING', label: 'Gaming' },
  { key: 'PRODUCTIVITY', label: 'Productividad' },
  { key: 'SOFTWARE', label: 'Software' },
];

type Props = {
  searchParams: {
    q?: string;
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    onlyVerified?: string;
    sort?: string;
    page?: string;
  };
};

export default async function ExplorePage({ searchParams }: Props) {
  const page = Math.max(1, Number(searchParams.page ?? 1));
  const limit = 16;
  const offset = (page - 1) * limit;
  const sort = (searchParams.sort as any) ?? 'newest';
  const onlyVerified = searchParams.onlyVerified === 'true';
  const category = searchParams.category ?? 'ALL';
  const q = searchParams.q ?? '';
  const minPrice = searchParams.minPrice;
  const maxPrice = searchParams.maxPrice;

  const qs = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
    sort,
    ...(onlyVerified && { onlyVerified: 'true' }),
    ...(category !== 'ALL' && { category }),
    ...(q && { serviceId: q }),
    ...(minPrice && { minPrice }),
    ...(maxPrice && { maxPrice }),
  });

  let data: { listings: any[]; total: number } = { listings: [], total: 0 };
  try {
    data = await apiFetch(`/marketplace/listings?${qs.toString()}`);
  } catch (e) {
    data = { listings: [], total: 0 };
  }

  const totalPages = Math.max(1, Math.ceil((data.total ?? 0) / limit));

  const paginate = (p: number) => {
    const n = new URLSearchParams({ ...searchParams, page: String(p) } as any);
    return `/explore?${n.toString()}`;
  };

  return (
    <div className="container-page py-10">
      {/* Banner público - browsing sin registro */}
      <div className="rounded-3xl border border-brand-100 bg-gradient-to-r from-brand-50/80 via-white to-emerald-50/60 p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="max-w-2xl">
            <span className="badge bg-white text-brand-600 border border-brand-200">
              <BadgeCheck className="h-3.5 w-3.5" />
              Browsing público · No necesitas cuenta para explorar
            </span>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
              Explora plazas verificadas y ahorra en tus suscripciones
            </h1>
            <p className="mt-2 text-gray-600">
              Encuentra cupos en Netflix, Spotify, Disney+, Prime Video, HBO Max y más. Paga
              cuando decidas comprar, con garantía de acceso.
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="rounded-2xl border border-gray-200 bg-white p-4 text-center shadow-card">
              <div className="text-2xl font-extrabold text-gray-900">{data.total}</div>
              <div className="text-xs text-gray-500">plazas activas</div>
            </div>
            <Link href="/onboarding" className="btn-primary">
              Vender mis cupos
            </Link>
          </div>
        </div>
      </div>

      {/* ================ FILTROS ================ */}
      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS_CATEGORY.map((c) => {
          const active = (category === 'ALL' && c.key === 'ALL') || category === c.key;
          const params = new URLSearchParams(searchParams as any);
          if (c.key === 'ALL') params.delete('category');
          else params.set('category', c.key);
          params.delete('page');
          return (
            <Link
              key={c.key}
              href={`/explore?${params.toString()}`}
              className={`chip ${active ? '!border-brand-500 !bg-brand-500 !text-white' : ''}`}
            >
              {c.label}
            </Link>
          );
        })}

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <label className="chip cursor-pointer">
            <Filter className="h-3.5 w-3.5" />
            Solo verificados
            <input
              type="checkbox"
              className="hidden"
              checked={onlyVerified}
              onChange={(e) => {
                const params = new URLSearchParams(searchParams as any);
                if (e.target.checked) params.set('onlyVerified', 'true');
                else params.delete('onlyVerified');
                location.href = `/explore?${params.toString()}`;
              }}
            />
            {onlyVerified && <CheckCircle2 className="h-3.5 w-3.5 text-brand-500" />}
          </label>
          <select
            className="chip !cursor-default !py-2"
            defaultValue={sort}
            onChange={(e) => {
              const params = new URLSearchParams(searchParams as any);
              params.set('sort', e.target.value);
              location.href = `/explore?${params.toString()}`;
            }}
          >
            <option value="newest">Más recientes</option>
            <option value="price_asc">Precio: menor a mayor</option>
            <option value="price_desc">Precio: mayor a menor</option>
          </select>
        </div>
      </div>

      {/* Search bar */}
      <div className="mt-4 card p-3 flex flex-wrap items-center gap-3">
        <div className="flex flex-1 items-center gap-2 rounded-full bg-gray-50 px-4 py-2">
          <Search className="h-4 w-4 text-gray-500" />
          <input
            placeholder="Buscar por servicio o categoría (ej: Netflix, Spotify)..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
            defaultValue={q}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const val = (e.target as HTMLInputElement).value;
                const params = new URLSearchParams(searchParams as any);
                if (val) params.set('q', val);
                else params.delete('q');
                params.delete('page');
                location.href = `/explore?${params.toString()}`;
              }
            }}
          />
        </div>
        <input
          className="input-field !w-36 !py-2 text-sm"
          type="number"
          placeholder="Precio min COP"
          defaultValue={minPrice}
          onBlur={(e) => {
            const params = new URLSearchParams(searchParams as any);
            if (e.target.value) params.set('minPrice', e.target.value);
            else params.delete('minPrice');
            location.href = `/explore?${params.toString()}`;
          }}
        />
        <input
          className="input-field !w-36 !py-2 text-sm"
          type="number"
          placeholder="Precio max COP"
          defaultValue={maxPrice}
          onBlur={(e) => {
            const params = new URLSearchParams(searchParams as any);
            if (e.target.value) params.set('maxPrice', e.target.value);
            else params.delete('maxPrice');
            location.href = `/explore?${params.toString()}`;
          }}
        />
        <button className="btn-primary !py-2">
          <SlidersHorizontal className="h-4 w-4" />
          Aplicar
        </button>
      </div>

      {/* ================ LISTADO ================ */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {data.listings.length === 0 ? (
          <div className="col-span-full card p-14 text-center">
            <Grid3X3 className="mx-auto h-10 w-10 text-gray-300" />
            <h3 className="mt-4 text-lg font-bold text-gray-900">Sin resultados aún</h3>
            <p className="mt-1 text-sm text-gray-600">
              Prueba cambiar filtros o explorar otra categoría.
            </p>
          </div>
        ) : (
          data.listings.map((l: any) => <ListingCard key={l.id} listing={l} />)
        )}
      </div>

      {/* ================ PAGINACIÓN ================ */}
      {totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-2">
          <Link
            href={paginate(Math.max(1, page - 1))}
            className={`btn-secondary !py-2 ${page === 1 ? 'pointer-events-none opacity-50' : ''}`}
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Link>
          <div className="text-sm text-gray-600">
            Página <span className="font-semibold text-gray-900">{page}</span> de {totalPages}
          </div>
          <Link
            href={paginate(Math.min(totalPages, page + 1))}
            className={`btn-secondary !py-2 ${page === totalPages ? 'pointer-events-none opacity-50' : ''}`}
          >
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
