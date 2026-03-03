import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class UsersService {
    async findAll() {
        return prisma.user.findMany({
            orderBy: { id: 'desc' },
            select: { id: true, email: true, fullName: true, role: true, createdAt: true }
        });
    }

    async findOne(id: number) {
        return prisma.user.findUnique({ where: { id } });
    }

    async create(data: any) {
        return prisma.user.create({
            data: {
                email: data.email,
                password: data.password || '123456',
                fullName: data.fullName,
                role: data.role || 'USER',
            },
        });
    }

    async update(id: number, data: any) {
        return prisma.user.update({
            where: { id },
            data: {
                email: data.email,
                fullName: data.fullName,
                role: data.role,
                ...(data.password ? { password: data.password } : {}),
            },
        });
    }

    async remove(id: number) {
        return prisma.user.delete({
            where: { id },
        });
    }
}