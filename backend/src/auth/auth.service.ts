// backend/src/auth/auth.service.ts
import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

@Injectable()
export class AuthService {
    constructor(private readonly jwtService: JwtService) { }

    async register(email: string, password: string, fullName: string) {
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            throw new ConflictException('Email này đã được đăng ký!');
        }

        const hashed = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { email, password: hashed, fullName },
            select: { id: true, email: true, fullName: true, role: true },
        });

        const token = this.jwtService.sign({ sub: user.id, email: user.email, role: user.role });
        return { user, token };
    }

    async login(email: string, password: string) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            throw new UnauthorizedException('Email hoặc mật khẩu không đúng!');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new UnauthorizedException('Email hoặc mật khẩu không đúng!');
        }

        const token = this.jwtService.sign({ sub: user.id, email: user.email, role: user.role });
        return {
            user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
            token,
        };
    }

    async getProfile(userId: number) {
        return prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, fullName: true, role: true, createdAt: true },
        });
    }
}