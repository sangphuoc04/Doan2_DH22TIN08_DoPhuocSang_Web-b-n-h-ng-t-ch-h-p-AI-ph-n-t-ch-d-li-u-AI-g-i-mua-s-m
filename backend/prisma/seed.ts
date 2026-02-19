// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/vi'; // Dùng tiếng Việt cho chuẩn

const prisma = new PrismaClient();

async function main() {
    console.log('👗 Bắt đầu tạo dữ liệu Shop Thời Trang...');

    // 1. Xóa sạch dữ liệu cũ (Reset)
    await prisma.review.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    await prisma.user.deleteMany();

    // 2. Tạo User
    console.log('Creating users...');
    const userIds: number[] = [];
    for (let i = 0; i < 50; i++) {
        const user = await prisma.user.create({
            data: {
                email: faker.internet.email(),
                password: 'hashed_password_123',
                fullName: faker.person.fullName(),
                role: 'USER',
            },
        });
        userIds.push(user.id);
    }

    // 3. Tạo Sản phẩm Thời trang (Quan trọng)
    console.log('Creating fashion products...');
    const productIds: { id: number; price: number }[] = [];

    // Danh sách từ khóa để ghép tên cho hay
    const clothingTypes = [
        'Áo Thun', 'Áo Sơ Mi', 'Áo Hoodie', 'Áo Khoác',
        'Quần Jeans', 'Quần Short', 'Quần Kaki',
        'Váy Dạ Hội', 'Chân Váy', 'Đầm Maxi'
    ];
    const adjectives = ['Basic', 'Hàn Quốc', 'Oversize', 'Slimfit', 'Vintage', 'Cao Cấp'];
    const materials = ['Cotton 100%', 'Vải Lanh', 'Kaki dày dặn', 'Lụa mềm', 'Denim'];

    for (let i = 0; i < 50; i++) {
        // Random tên sản phẩm: "Áo Thun" + "Hàn Quốc"
        const type = clothingTypes[Math.floor(Math.random() * clothingTypes.length)];
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const material = materials[Math.floor(Math.random() * materials.length)];

        const name = `${type} ${adj} ${faker.commerce.productName().split(' ')[0]}`; // Thêm tí random cho đỡ trùng

        const price = parseFloat(faker.commerce.price({ min: 150000, max: 1500000 })); // Giá từ 150k - 1tr5

        // Tạo mô tả có Size và Màu để Chatbot tư vấn
        const description = `
      Mẫu ${name} thiết kế mới nhất mùa này.
      - Chất liệu: ${material} thoáng mát, thấm hút mồ hôi.
      - Size: Đủ size S, M, L, XL cho người từ 45kg đến 85kg.
      - Màu sắc: Đen, Trắng, Be, Xanh Navy.
      - Phù hợp đi học, đi làm hoặc đi chơi. Cam kết hàng chính hãng.
    `;

        const product = await prisma.product.create({
            data: {
                name: name,
                description: description.trim(),
                price: price,
                costPrice: price * 0.6, // Lãi 40%
                stock: faker.number.int({ min: 20, max: 200 }),
                // Lưu Category dựa trên tên
                category: type.includes('Áo') ? 'Áo' : (type.includes('Quần') ? 'Quần' : 'Váy/Đầm'),
                // Ảnh placeholder thời trang
                image: `https://loremflickr.com/320/240/clothing,fashion?lock=${i}`,
            },
        });
        productIds.push({ id: product.id, price: product.price });
    }

    // 4. Tạo Đơn hàng (Logic Mùa vụ cho AI Dự báo)
    console.log('Creating fashion orders...');
    for (let i = 0; i < 1000; i++) {
        const randomUserId = userIds[Math.floor(Math.random() * userIds.length)];
        const randomProduct = productIds[Math.floor(Math.random() * productIds.length)];
        const quantity = faker.number.int({ min: 1, max: 3 }); // Quần áo thường mua ít cái/lần

        const pastDate = faker.date.recent({ days: 365 });
        const month = pastDate.getMonth() + 1;

        // Giả lập: Mùa Tết (tháng 12, 1) và Mùa Hè (tháng 6, 7) bán chạy
        const isPeakSeason = [12, 1, 6, 7].includes(month);

        // Nếu là mùa cao điểm thì tăng tỷ lệ tạo đơn hàng
        if (isPeakSeason || Math.random() > 0.6) {
            await prisma.order.create({
                data: {
                    userId: randomUserId,
                    totalAmount: randomProduct.price * quantity,
                    status: 'COMPLETED',
                    createdAt: pastDate,
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
    }

    // 5. Tạo Review
    console.log('Creating reviews...');
    const fashionComments = [
        "Vải đẹp, mặc mát.", "Form hơi rộng so với size.", "Giao hàng nhanh, đóng gói đẹp.",
        "Màu ở ngoài hơi tối hơn ảnh.", "Sẽ ủng hộ shop dài dài.", "Chất vải hơi mỏng."
    ];

    for (let i = 0; i < 300; i++) {
        const randomUserId = userIds[Math.floor(Math.random() * userIds.length)];
        const randomProduct = productIds[Math.floor(Math.random() * productIds.length)];

        await prisma.review.create({
            data: {
                userId: randomUserId,
                productId: randomProduct.id,
                content: fashionComments[Math.floor(Math.random() * fashionComments.length)],
                rating: faker.number.int({ min: 3, max: 5 })
            }
        });
    }

    console.log('✅ Đã tạo xong Shop Thời Trang! Database sạch đẹp.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });