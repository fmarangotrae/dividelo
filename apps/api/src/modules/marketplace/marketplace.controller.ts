import { Controller, Get, Post, Param, Query, Body, UseGuards, Request } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly service: MarketplaceService) {}

  @Get('services')
  listServices(@Query('category') category?: string) {
    return this.service.listServices(category);
  }

  @Get('listings')
  searchListings(
    @Query('serviceId') serviceId?: string,
    @Query('category') category?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('onlyVerified') onlyVerified?: string,
    @Query('sort') sort?: 'price_asc' | 'price_desc' | 'newest',
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.service.searchListings({
      serviceId,
      category,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      onlyVerified: onlyVerified === 'true' || onlyVerified === '1',
      sort,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }

  @Get('listings/:id')
  getListing(@Param('id') id: string) {
    return this.service.getListingDetail(id);
  }

  @Post('listings')
  @UseGuards(AuthGuard('jwt'))
  createListing(@Request() req: any, @Body() body: any) {
    return this.service.createListing(req.user.id, body);
  }

  @Post('listings/:id/join')
  @UseGuards(AuthGuard('jwt'))
  joinListing(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.service.joinListing(req.user.id, id, body);
  }
}
