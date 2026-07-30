import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { BillingPayoutsService } from './billing-payouts.service';
import { BillingEscrowService } from './billing-escrow.service';

@Controller('billing')
export class BillingController {
  constructor(
    private readonly payouts: BillingPayoutsService,
    private readonly escrow: BillingEscrowService,
  ) {}

  @Get('wallet/:userId')
  async getWallet(@Param('userId') userId: string) {
    return this.escrow.getWallet(userId);
  }

  @Get('ledger/:userId')
  async getLedger(
    @Param('userId') userId: string,
    @Query('limit') limit = 50,
  ) {
    return this.escrow.getUserLedger(userId, limit);
  }

  @Post('payouts')
  async requestPayout(@Body() body: any) {
    return this.payouts.requestPayout(body);
  }

  @Get('payouts/:userId')
  async listPayouts(@Param('userId') userId: string) {
    return this.payouts.getUserPayouts(userId);
  }
}
