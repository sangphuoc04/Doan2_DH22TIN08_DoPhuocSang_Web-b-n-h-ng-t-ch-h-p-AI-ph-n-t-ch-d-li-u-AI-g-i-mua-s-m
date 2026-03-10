// backend/src/orders/dto/create-order.dto.ts
export class CreateOrderDto {
    userId: number;
    totalAmount: number;
    shippingAddress: string;
    phone: string;
    note?: string;
    paymentMethod: string;
}