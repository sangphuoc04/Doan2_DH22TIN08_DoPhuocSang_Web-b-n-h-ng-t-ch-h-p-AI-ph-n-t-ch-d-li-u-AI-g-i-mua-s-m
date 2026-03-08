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

            let result;
            if (existingItem) {
                result = await prisma.cartItem.update({
                    where: { id: existingItem.id },
                    data: { quantity: existingItem.quantity + quantity },
                });
            } else {
                result = await prisma.cartItem.create({
                    data: {
                        cartId: cart.id,
                        productId: productId,
                        quantity: quantity,
                    },
                });
            }

            // ==========================================
            // BỔ SUNG: GHI LẠI HÀNH ĐỘNG CHO AI PHÂN TÍCH
            // ==========================================
            await prisma.userInteraction.create({
                data: {
                    userId: userId,
                    productId: productId,
                    action: 'ADD_TO_CART'
                }
            });

            return result;

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
            const result = await prisma.cartItem.deleteMany({
                where: {
                    cartId: cart.id,
                    productId: productId,
                },
            });

            // ==========================================
            // BỔ SUNG: GHI LẠI HÀNH ĐỘNG CHO AI PHÂN TÍCH
            // ==========================================
            await prisma.userInteraction.create({
                data: {
                    userId: userId,
                    productId: productId,
                    action: 'REMOVE_FROM_CART'
                }
            });

            return result;

        } catch (error) {
            console.error("Lỗi Prisma khi xóa khỏi giỏ:", error);
            throw error;
        }
    }
}