import { Module } from '@nestjs/common';
import { BillingEscrowService } from './billing-escrow.service';
import { BillingLedgerService } from './billing-ledger.service';
import { BillingPayoutsService } from './billing-payouts.service';
import { BillingController } from './billing.controller';

@Module({
  controllers: [BillingController],
  providers: [BillingLedgerService, BillingEscrowService, BillingPayoutsService],
  exports: [BillingLedgerService, BillingEscrowService, BillingPayoutsService],
})
export class BillingModule {}
