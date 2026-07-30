import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { prisma } from '@dividelo/db';
import { calcReputationScore } from '@dividelo/shared';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(private readonly jwt: JwtService) {}

  // Simulación de OTP; en producción integrar Twilio/Mensario
  private readonly otpStore = new Map<string, { otp: string; expires: number }>();

  async sendOtp(input: { phone?: string; email?: string }) {
    if (!input.phone && !input.email) throw new BadRequestException('Phone o email requerido');
    const key = input.phone ? `phone:${input.phone}` : `email:${input.email}`;
    const otp = '123456'; // TODO: random 6 dígitos
    this.otpStore.set(key, { otp, expires: Date.now() + 5 * 60 * 1000 });
    // TODO: enviar SMS / email real
    return { ok: true, sentTo: key, otpForDev: otp };
  }

  async verifyOtp(input: { phone?: string; email?: string; otp: string }) {
    const key = input.phone ? `phone:${input.phone}` : `email:${input.email}`;
    const stored = this.otpStore.get(key);
    if (!stored || stored.expires < Date.now() || stored.otp !== input.otp) {
      throw new BadRequestException('OTP inválido o expirado');
    }
    this.otpStore.delete(key);

    // Upsert user
    const userData: any = {};
    if (input.phone) {
      userData.phone = input.phone;
      userData.phoneVerified = true;
    }
    if (input.email) {
      userData.email = input.email;
      userData.emailVerified = true;
    }

    let user = input.phone
      ? await prisma.user.findUnique({ where: { phone: input.phone } })
      : await prisma.user.findUnique({ where: { email: input.email } });

    if (!user) {
      user = await prisma.user.create({
        data: { ...userData, reputationScore: 50, onboardingCompleted: false },
      });
      // wallet inicial
      await prisma.wallet.create({ data: { userId: user.id } });
    } else {
      user = await prisma.user.update({ where: { id: user.id }, data: userData });
    }

    const token = this.jwt.sign({ userId: user.id });
    return { ok: true, token, user, onboardingCompleted: user.onboardingCompleted };
  }

  async setPassword(input: { userId: string; password: string; name?: string }) {
    const hash = await bcrypt.hash(input.password, 10);
    const user = await prisma.user.update({
      where: { id: input.userId },
      data: {
        passwordHash: hash,
        name: input.name,
      },
    });
    return { ok: true, user };
  }

  async loginWithPassword(input: { email: string; password: string }) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user || !user.passwordHash) throw new BadRequestException('Credenciales inválidas');
    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) throw new BadRequestException('Credenciales inválidas');
    const token = this.jwt.sign({ userId: user.id });
    return { ok: true, token, user };
  }

  async me(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true, kyc: true },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    // Actualizar score
    const score = calcReputationScore({
      totalTransactions: user.totalTransactions,
      successfulTransactions: user.successfulTransactions,
      disputesLost: user.disputesLost,
      disputesInitiated: 0,
      averageRatingStars: 4.5,
      accountAgeDays: Math.floor((Date.now() - user.createdAt.getTime()) / 86400000),
      kycLevel: user.kyc?.level ?? 0,
      phoneVerified: user.phoneVerified,
      emailVerified: user.emailVerified,
      payoutFailed: 0,
    });
    await prisma.user.update({ where: { id: userId }, data: { reputationScore: score } });

    return { ...user, reputationScore: score };
  }
}
