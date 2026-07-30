import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaymentRouterService } from './adapters/payment-router.service';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [BillingModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentRouterService],
  exports: [PaymentsService, PaymentRouterService],
})
export class PaymentsModule {}
