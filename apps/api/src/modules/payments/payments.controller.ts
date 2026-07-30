import { Body, Controller, Get, Param, Post, Req, Res, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post('checkout')
  async createCheckout(@Body() body: any) {
    return this.payments.initCheckout(body);
  }

  @Get(':id')
  async getPayment(@Param('id') id: string) {
    return this.payments.getPayment(id);
  }

  @Post(':id/confirm-access')
  async confirmGuestAccess(@Param('id') id: string, @Body() body: { confirmedBy: string }) {
    return this.payments.confirmGuestAccessOK(id, body.confirmedBy);
  }

  @Post('webhooks/:provider')
  @HttpCode(HttpStatus.OK)
  async webhook(
    @Param('provider') provider: 'wompi' | 'placetopay',
    @Req() req: Request,
    @Res() res: Response,
    @Headers() headers: Record<string, string>,
  ) {
    try {
      const rawBody = (req as any).rawBody ?? JSON.stringify(req.body);
      const result = await this.payments.handleWebhook(provider, rawBody, headers);
      return res.status(result.ok ? 200 : 400).json({ ok: result.ok });
    } catch (e: any) {
      return res.status(500).json({ ok: false, error: e.message });
    }
  }
}
