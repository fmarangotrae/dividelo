import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('send-otp')
  async sendOtp(@Body() body: { phone?: string; email?: string }) {
    return this.auth.sendOtp(body);
  }

  @Post('verify-otp')
  async verifyOtp(@Body() body: { phone?: string; email?: string; otp: string; fcmToken?: string }) {
    return this.auth.verifyOtp(body);
  }

  @Post('register-password')
  async registerPassword(@Body() body: { userId: string; password: string; name?: string }) {
    return this.auth.setPassword(body);
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    return this.auth.loginWithPassword(body);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async me(@Req() req: any) {
    return this.auth.me(req.user.userId);
  }
}
