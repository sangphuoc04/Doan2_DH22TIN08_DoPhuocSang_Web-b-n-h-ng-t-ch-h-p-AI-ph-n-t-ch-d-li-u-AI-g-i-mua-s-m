import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/vi';

const prisma = new PrismaClient();

async function main() {
    console.log('⏳ Đang xóa sạch dữ liệu cũ (đúng thứ tự để không lỗi khóa ngoại)...');
    await prisma.userInteraction.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.cart.deleteMany();
    await prisma.review.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    await prisma.user.deleteMany();

    console.log('👤 Đang tạo danh sách 30 Users...');
    const userIds: number[] = [];
    for (let i = 0; i < 30; i++) {
        const user = await prisma.user.create({
            data: {
                email: faker.internet.email(),
                password: 'hashed_password_123',
                fullName: faker.person.fullName(),
                phone: faker.phone.number(),
                address: faker.location.streetAddress(),
                role: i === 0 ? 'ADMIN' : 'USER', // User đầu tiên làm Admin
            },
        });
        userIds.push(user.id);
    }

    console.log('👗 Đang tạo 20 Sản phẩm Thời trang...');
    const productIds: number[] = [];
    const productsData: any[] = []; // THÊM KIỂU ANY ĐỂ FIX LỖI
    const clothingTypes = ['Áo Thun', 'Áo Sơ Mi', 'Áo Khoác', 'Quần Jeans', 'Quần Short', 'Chân Váy', 'Đầm'];
    const adjectives = ['Hàn Quốc', 'Oversize', 'Slimfit', 'Vintage', 'Cao Cấp', 'Basic'];

    for (let i = 0; i < 20; i++) {
        const type = clothingTypes[Math.floor(Math.random() * clothingTypes.length)];
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const name = `${type} ${adj} ${faker.commerce.productMaterial()}`;
        const price = faker.number.int({ min: 15, max: 150 }) * 10000; // 150k - 1.5M

        const product = await prisma.product.create({
            data: {
                name: name,
                description: `Mẫu ${name} thiết kế mới nhất. Chất vải cực đẹp, thấm hút mồ hôi. Đủ size S, M, L, XL.`,
                price: price,
                costPrice: price * 0.6, // Lãi 40% (Đúng với schema của bạn)
                stock: faker.number.int({ min: 10, max: 100 }),
                category: type.includes('Áo') ? 'Áo' : (type.includes('Quần') ? 'Quần' : 'Váy'),
                image: `https://loremflickr.com/400/400/clothing?lock=${i}`,
            },
        });
        productIds.push(product.id);
        productsData.push(product);
    }

    console.log('📦 Đang tạo Đơn hàng (Cho AI Dự báo doanh thu & Phân cụm RFM)...');
    for (let i = 0; i < 300; i++) {
        const randomUserId = userIds[Math.floor(Math.random() * userIds.length)];
        const randomProduct = productsData[Math.floor(Math.random() * productsData.length)];
        const quantity = faker.number.int({ min: 1, max: 3 });

        const pastDate = faker.date.past({ years: 1 });

        await prisma.order.create({
            data: {
                userId: randomUserId,
                totalAmount: randomProduct.price * quantity,
                status: 'COMPLETED',
                createdAt: pastDate,
                shippingAddress: faker.location.streetAddress(),
                phoneNumber: faker.phone.number(),
                paymentMethod: 'COD',
                items: {
                    create: {
                        productId: randomProduct.id,
                        quantity: quantity,
                        price: randomProduct.price
                    }
                }
            },
        });
    }

    console.log('⭐ Đang tạo Đánh giá (Cho AI Phân tích cảm xúc Sentiment)...');
    const positiveReviews = ["Vải xịn, mặc rất mát", "Giao hàng siêu nhanh", "Form đẹp, sẽ ủng hộ shop tiếp", "Đáng đồng tiền bát gạo"];
    const negativeReviews = ["Chất vải quá mỏng", "Giao sai màu", "Mặc bị nóng, không như quảng cáo", "Form bị lỗi, chỉ may lởm chởm"];

    const badProductId = productIds[0];

    for (let i = 0; i < 100; i++) {
        const isBad = Math.random() < 0.2; // 20% là review xấu
        const pId = isBad ? badProductId : productIds[Math.floor(Math.random() * productIds.length)];
        const content = isBad
            ? negativeReviews[Math.floor(Math.random() * negativeReviews.length)]
            : positiveReviews[Math.floor(Math.random() * positiveReviews.length)];

        await prisma.review.create({
            data: {
                userId: userIds[Math.floor(Math.random() * userIds.length)],
                productId: pId,
                content: content,
                rating: isBad ? faker.number.int({ min: 1, max: 2 }) : faker.number.int({ min: 4, max: 5 }),
            }
        });
    }

    console.log('🛒 Đang tạo Lịch sử Giỏ hàng (Cho AI Phân tích Xu hướng & Flashsale)...');
    const trendingProd1 = productIds[1];
    const trendingProd2 = productIds[2];
    const flashsaleProd1 = productIds[3];

    const mockInteractions: any[] = []; // THÊM KIỂU ANY ĐỂ FIX LỖI

    for (let i = 0; i < 25; i++) {
        mockInteractions.push({ userId: userIds[i % userIds.length], productId: trendingProd1, action: 'ADD_TO_CART' });
        mockInteractions.push({ userId: userIds[i % userIds.length], productId: trendingProd2, action: 'ADD_TO_CART' });
    }
    mockInteractions.push({ userId: userIds[0], productId: trendingProd1, action: 'REMOVE_FROM_CART' });

    for (let i = 0; i < 15; i++) {
        mockInteractions.push({ userId: userIds[i % userIds.length], productId: flashsaleProd1, action: 'ADD_TO_CART' });
        mockInteractions.push({ userId: userIds[i % userIds.length], productId: flashsaleProd1, action: 'REMOVE_FROM_CART' });
        mockInteractions.push({ userId: userIds[i % userIds.length], productId: flashsaleProd1, action: 'REMOVE_FROM_CART' });
    }

    await prisma.userInteraction.createMany({ data: mockInteractions });

    console.log('✅ SEED HOÀN TẤT! Dữ liệu đã chuẩn bị sẵn sàng cho tất cả AI.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });