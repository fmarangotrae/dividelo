import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './modules/auth/auth.module';
import { MarketplaceModule } from './modules/marketplace/marketplace.module';
import { BillingModule } from './modules/billing/billing.module';
import { PaymentsModule } from './modules/payments/payments.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env', '../../.env.local'],
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    MarketplaceModule,
    BillingModule,
    PaymentsModule,
  ],
})
export class AppModule {}
