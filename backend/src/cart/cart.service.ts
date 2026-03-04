import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class CartService {

    async addToCart(userId: number, productId: number, quantity: number) {
        try {
            let cart = await prisma.cart.findUnique({
                where: { userId: userId },
            });

            if (!cart) {
                cart = await prisma.cart.create({
                    data: { userId: userId },
                });
            }

            const existingItem = await prisma.cartItem.findFirst({
                where: {
                    cartId: cart.id,
                    productId: productId,
                },
            });

            if (existingItem) {
                return await prisma.cartItem.update({
                    where: { id: existingItem.id },
                    data: { quantity: existingItem.quantity + quantity },
                });
            } else {
                return await prisma.cartItem.create({
                    data: {
                        cartId: cart.id,
                        productId: productId,
                        quantity: quantity,
                    },
                });
            }
        } catch (error) {
            console.error("Lỗi Prisma khi thêm vào giỏ:", error);
            throw error;
        }
    }

    async getCart(userId: number) {
        const cart = await prisma.cart.findUnique({
            where: { userId },
            include: {
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });

        if (!cart) return { items: [], totalCount: 0 };

        const totalCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

        return {
            ...cart,
            totalCount
        };
    }

    async removeFromCart(userId: number, productId: number) {
        try {
            // Tìm giỏ hàng của user
            const cart = await prisma.cart.findUnique({
                where: { userId: userId },
            });

            if (!cart) {
                throw new Error("Không tìm thấy giỏ hàng");
            }

            // Xóa sản phẩm khỏi giỏ
            return await prisma.cartItem.deleteMany({
                where: {
                    cartId: cart.id,
                    productId: productId,
                },
            });
        } catch (error) {
            console.error("Lỗi Prisma khi xóa khỏi giỏ:", error);
            throw error;
        }
    }
}