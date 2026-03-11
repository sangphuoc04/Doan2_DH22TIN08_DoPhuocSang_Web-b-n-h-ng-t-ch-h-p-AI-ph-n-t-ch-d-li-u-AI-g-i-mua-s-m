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

    console.log('👤 Đang tạo danh sách 50 Users...');
    const userIds: number[] = [];
    for (let i = 0; i < 50; i++) {
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

    console.log('👗 Đang tạo 200 Sản phẩm Thời trang...');
    const productIds: number[] = [];
    const productsData: any[] = []; // Đã fix lỗi TypeScript Strict Mode
    const clothingTypes = ['Áo Thun', 'Áo Sơ Mi', 'Áo Khoác', 'Quần Jeans', 'Quần Short', 'Chân Váy', 'Đầm'];
    const adjectives = ['Hàn Quốc', 'Oversize', 'Slimfit', 'Vintage', 'Cao Cấp', 'Basic'];

    for (let i = 0; i < 200; i++) {
        const type = clothingTypes[Math.floor(Math.random() * clothingTypes.length)];
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const name = `${type} ${adj} ${faker.commerce.productMaterial()}`;
        const price = faker.number.int({ min: 15, max: 150 }) * 10000; // 150k - 1.5M

        const product = await prisma.product.create({
            data: {
                name: name,
                description: `Mẫu ${name} thiết kế mới nhất. Chất vải cực đẹp, thấm hút mồ hôi. Đủ size S, M, L, XL.`,
                price: price,
                costPrice: price * 0.6, // Lãi 40% 
                stock: faker.number.int({ min: 10, max: 100 }),
                category: type.includes('Áo') ? 'Áo' : (type.includes('Quần') ? 'Quần' : 'Váy'),
                image: `https://loremflickr.com/400/400/clothing?lock=${i}`,
            },
        });
        productIds.push(product.id);
        productsData.push(product);
    }

    console.log('📦 Đang tạo 200 Đơn hàng...');
    for (let i = 0; i < 200; i++) {
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

    console.log('⭐ Đang tạo 200 Đánh giá...');
    const positiveReviews = ["Vải xịn, mặc rất mát", "Giao hàng siêu nhanh", "Form đẹp, sẽ ủng hộ shop tiếp", "Đáng đồng tiền bát gạo"];
    const negativeReviews = ["Chất vải quá mỏng", "Giao sai màu", "Mặc bị nóng, không như quảng cáo", "Form bị lỗi, chỉ may lởm chởm"];

    const badProductId = productIds[0];

    for (let i = 0; i < 200; i++) {
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

    console.log('🛒 Đang tạo 200 Lịch sử Tương tác Giỏ hàng (Cho AI)...');
    const trendingProd1 = productIds[1];
    const trendingProd2 = productIds[2];
    const flashsaleProd1 = productIds[3];
    const flashsaleProd2 = productIds[4];

    const mockInteractions: any[] = []; // Fix lỗi strict mode 

    // 1. Kịch bản Xu hướng 1 (40 adds, 2 removes)
    for (let i = 0; i < 40; i++) {
        mockInteractions.push({ userId: userIds[i % userIds.length], productId: trendingProd1, action: 'ADD_TO_CART' });
    }
    for (let i = 0; i < 2; i++) {
        mockInteractions.push({ userId: userIds[i], productId: trendingProd1, action: 'REMOVE_FROM_CART' });
    }

    // 2. Kịch bản Xu hướng 2 (35 adds, 3 removes)
    for (let i = 0; i < 35; i++) {
        mockInteractions.push({ userId: userIds[i % userIds.length], productId: trendingProd2, action: 'ADD_TO_CART' });
    }
    for (let i = 0; i < 3; i++) {
        mockInteractions.push({ userId: userIds[i], productId: trendingProd2, action: 'REMOVE_FROM_CART' });
    }

    // 3. Kịch bản Flashsale 1 (15 adds, 45 removes)
    for (let i = 0; i < 15; i++) {
        mockInteractions.push({ userId: userIds[i % userIds.length], productId: flashsaleProd1, action: 'ADD_TO_CART' });
    }
    for (let i = 0; i < 45; i++) {
        mockInteractions.push({ userId: userIds[i % userIds.length], productId: flashsaleProd1, action: 'REMOVE_FROM_CART' });
    }

    // 4. Kịch bản Flashsale 2 (15 adds, 45 removes)
    for (let i = 0; i < 15; i++) {
        mockInteractions.push({ userId: userIds[i % userIds.length], productId: flashsaleProd2, action: 'ADD_TO_CART' });
    }
    for (let i = 0; i < 45; i++) {
        mockInteractions.push({ userId: userIds[i % userIds.length], productId: flashsaleProd2, action: 'REMOVE_FROM_CART' });
    }

    // Tổng cộng mảng này sẽ có chính xác 200 records (42 + 38 + 60 + 60 = 200)
    await prisma.userInteraction.createMany({ data: mockInteractions });

    console.log('✅ SEED HOÀN TẤT! Đã tạo 50 Users và đúng 200 bản ghi cho từng mục khác.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });