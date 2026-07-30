import { Injectable, BadRequestException } from '@nestjs/common';
import { prisma } from '@dividelo/db';
import { calcPriceBreakdown, calcGuestSavings, calcHostNetCost } from '@dividelo/shared';
import type { PaymentMethod, SubscriptionCategory } from '@dividelo/db';

@Injectable()
export class MarketplaceService {
  async ensureSeedServices() {
    const count = await prisma.subscriptionService.count();
    if (count > 0) return;

    const seed = [
      {
        name: 'Netflix',
        slug: 'netflix',
        category: 'STREAMING_VIDEO' as SubscriptionCategory,
        description: 'Streaming de series y películas',
        platformFeePercent: 9,
        maxMarkupPercent: 10,
        basePlans: [
          { name: 'Premium 4K', totalSlots: 4, officialPriceCOP: 54900 },
          { name: 'Standard HD', totalSlots: 2, officialPriceCOP: 38900 },
        ],
      },
      {
        name: 'Spotify',
        slug: 'spotify',
        category: 'STREAMING_MUSIC' as SubscriptionCategory,
        description: 'Música y podcasts',
        platformFeePercent: 9,
        maxMarkupPercent: 10,
        basePlans: [{ name: 'Family', totalSlots: 6, officialPriceCOP: 27900 }],
      },
      {
        name: 'Disney+',
        slug: 'disney-plus',
        category: 'STREAMING_VIDEO' as SubscriptionCategory,
        description: 'Disney, Marvel, Star Wars',
        platformFeePercent: 9,
        maxMarkupPercent: 10,
        basePlans: [{ name: 'Premium', totalSlots: 4, officialPriceCOP: 31900 }],
      },
      {
        name: 'Prime Video',
        slug: 'prime-video',
        category: 'STREAMING_VIDEO' as SubscriptionCategory,
        description: 'Incluido con Amazon Prime',
        platformFeePercent: 9,
        maxMarkupPercent: 10,
        basePlans: [{ name: 'Prime', totalSlots: 3, officialPriceCOP: 23900 }],
      },
      {
        name: 'HBO Max',
        slug: 'hbo-max',
        category: 'STREAMING_VIDEO' as SubscriptionCategory,
        platformFeePercent: 9,
        maxMarkupPercent: 10,
        basePlans: [{ name: 'Premium', totalSlots: 3, officialPriceCOP: 29900 }],
      },
      {
        name: 'Xbox Game Pass',
        slug: 'xbox-game-pass',
        category: 'GAMING' as SubscriptionCategory,
        platformFeePercent: 10,
        maxMarkupPercent: 10,
        basePlans: [{ name: 'Ultimate', totalSlots: 4, officialPriceCOP: 49900 }],
      },
      {
        name: 'Paramount+',
        slug: 'paramount-plus',
        category: 'STREAMING_VIDEO' as SubscriptionCategory,
        platformFeePercent: 9,
        maxMarkupPercent: 10,
        basePlans: [{ name: 'Premium', totalSlots: 3, officialPriceCOP: 19900 }],
      },
      {
        name: 'Notion AI',
        slug: 'notion',
        category: 'PRODUCTIVITY' as SubscriptionCategory,
        platformFeePercent: 7,
        maxMarkupPercent: 10,
        basePlans: [{ name: 'Business', totalSlots: 5, officialPriceCOP: 72000 }],
      },
    ];
    await prisma.subscriptionService.createMany({ data: seed });
  }

  async listServices(category?: string) {
    await this.ensureSeedServices();
    const where = category ? { category: category as SubscriptionCategory } : {};
    return prisma.subscriptionService.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async searchListings(input: {
    serviceId?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    onlyVerified?: boolean;
    sort?: 'price_asc' | 'price_desc' | 'newest';
    limit?: number;
    offset?: number;
  }) {
    await this.ensureSeedServices();
    const { serviceId, category, minPrice, maxPrice, onlyVerified, sort, limit = 20, offset = 0 } = input;

    const where: any = { status: 'ACTIVE' };
    if (serviceId) where.subscriptionServiceId = serviceId;
    if (category) where.subscriptionService = { category: category as SubscriptionCategory };
    if (onlyVerified) where.host = { kyc: { status: 'VERIFIED' } };
    if (minPrice !== undefined) where.baseSlotPriceCOP = { gte: minPrice };
    if (maxPrice !== undefined) {
      where.baseSlotPriceCOP = { ...(where.baseSlotPriceCOP || {}), lte: maxPrice };
    }

    const orderBy: any =
      sort === 'price_asc'
        ? { baseSlotPriceCOP: 'asc' }
        : sort === 'price_desc'
        ? { baseSlotPriceCOP: 'desc' }
        : { createdAt: 'desc' };

    const [rows, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          subscriptionService: true,
          host: {
            select: {
              id: true,
              name: true,
              reputationScore: true,
              kyc: { select: { status: true, level: true } },
            },
          },
        },
        orderBy,
        take: limit,
        skip: offset,
      }),
      prisma.listing.count({ where }),
    ]);

    const method: PaymentMethod = 'NEQUI';
    const listings = rows.map((r) => {
      const base = Number(r.baseSlotPriceCOP);
      const pricing = calcPriceBreakdown({
        baseSlotPriceCOP: base,
        markupPercent: r.markupPercent,
        category: r.subscriptionService.category,
        method,
        gateway: 'wompi',
      });
      const officialIndividual =
        (r.subscriptionService.basePlans as any)?.[0]?.officialPriceCOP ?? base * 2;
      const savings = calcGuestSavings(pricing.totalGuestPriceCOP, officialIndividual);
      return { ...r, guestPricePreviewCOP: pricing.totalGuestPriceCOP, savingsPercent: savings };
    });

    return { listings, total, limit, offset };
  }

  async getListingDetail(id: string) {
    await this.ensureSeedServices();
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        subscriptionService: true,
        host: {
          include: { kyc: true },
        },
        memberships: {
          include: { guest: { select: { id: true, name: true, reputationScore: true } } },
        },
      },
    });
    if (!listing) return null;

    const host: any = listing.host;
    const officialIndividual =
      (listing.subscriptionService.basePlans as any)?.[0]?.officialPriceCOP ?? 0;
    const totalPlan = officialIndividual;

    const previewMethods: PaymentMethod[] = ['NEQUI', 'PSE', 'CREDIT_CARD'];
    const pricingByMethod: Record<string, any> = {};
    for (const m of previewMethods) {
      pricingByMethod[m] = calcPriceBreakdown({
        baseSlotPriceCOP: Number(listing.baseSlotPriceCOP),
        markupPercent: listing.markupPercent,
        category: listing.subscriptionService.category,
        method: m,
        gateway: 'wompi',
      });
    }

    const hostPayoutTotal = Number(pricingByMethod['NEQUI']?.hostNetPayoutCOP ?? 0);
    const slotsSold = listing.totalSlots - listing.availableSlots;
    const netCost = calcHostNetCost(totalPlan, slotsSold * hostPayoutTotal);

    return {
      ...listing,
      pricingByMethod,
      guestSavingsPercent: calcGuestSavings(
        pricingByMethod['NEQUI']?.totalGuestPriceCOP ?? 0,
        officialIndividual,
      ),
      hostNetCost: netCost,
      planOfficialPriceCOP: officialIndividual,
      hostBadges: [
        host.kyc?.status === 'VERIFIED' && 'VERIFIED',
        host.reputationScore >= 85 && 'TRUSTED',
        host.successfulTransactions >= 10 && 'TOP_HOST',
      ].filter(Boolean),
    };
  }

  async createListing(hostId: string, body: any) {
    const service = await prisma.subscriptionService.findUnique({
      where: { id: body.subscriptionServiceId },
    });
    if (!service) throw new BadRequestException('Servicio inválido');
    if (body.markupPercent > service.maxMarkupPercent) {
      throw new BadRequestException(`Markup máximo ${service.maxMarkupPercent}%`);
    }
    if (body.availableSlots >= body.totalSlots) {
      throw new BadRequestException('availableSlots debe ser menor que totalSlots');
    }
    const listing = await prisma.listing.create({
      data: {
        hostId,
        subscriptionServiceId: service.id,
        planName: body.planName,
        totalSlots: body.totalSlots,
        availableSlots: body.availableSlots,
        baseSlotPriceCOP: body.baseSlotPriceCOP,
        markupPercent: body.markupPercent,
        customInstructions: body.customInstructions,
        autoAccept: body.autoAccept ?? true,
      },
    });
    return listing;
  }

  async joinListing(guestId: string, listingId: string, _body: any) {
    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) throw new BadRequestException('Listing no existe');
    if (listing.availableSlots <= 0) throw new BadRequestException('Sin cupos');

    const membership = await prisma.membership.create({
      data: {
        listingId,
        guestId,
        slotNumber: listing.totalSlots - listing.availableSlots + 1,
        status: 'PENDING_CONFIRMATION',
        startDate: new Date(),
        agreedSlotPriceCOP: listing.baseSlotPriceCOP,
        agreedMarkupPercent: listing.markupPercent,
        nextBillingDate: new Date(Date.now() + 30 * 86400000),
      },
    });

    await prisma.listing.update({
      where: { id: listingId },
      data: { availableSlots: { decrement: 1 } },
    });

    return membership;
  }
}
