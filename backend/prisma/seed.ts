/**
 * Первичное наполнение БД: админ из env + категории и товары текущего сайта.
 * Запуск: npm run seed (идемпотентен — повторный запуск ничего не дублирует).
 */
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const baseColors = [
  { name: "Белый", hex: "#F4F4F1" },
  { name: "Чёрный", hex: "#16161A" },
];

const categories = [
  {
    slug: "s-printom",
    title: "С готовым принтом",
    description:
      "Готовые дизайны из каталога — выберите принт и закажите в один клик.",
    image: "/categories/ready-print.webp",
    sortOrder: 1,
  },
  {
    slug: "s-foto",
    title: "С вашим фото",
    description:
      "Перенесём любое фото на ткань с фотографическим качеством и стойкими цветами.",
    image: "/categories/photo-print.webp",
    sortOrder: 2,
  },
  {
    slug: "s-nadpisyu",
    title: "С надписью",
    description:
      "Цитата, имя, дата или мем — соберём типографику и напечатаем за 1 день.",
    image: "/categories/text-print.webp",
    sortOrder: 3,
  },
  {
    slug: "s-logotipom",
    title: "С логотипом",
    description:
      "Корпоративный мерч и брендирование: логотип в фирменных цветах, любой тираж.",
    image: "/categories/logo-print.webp",
    sortOrder: 4,
  },
];

const products = [
  {
    slug: "oversize-premium",
    sku: "RP-TS-001",
    title: "Oversize Premium",
    excerpt: "Плотный хлопок 240 г/м², свободный крой, насыщенная печать.",
    description:
      "Флагманская модель для принта на всю грудь и спину. Плотный кулирный хлопок 240 г/м² держит форму после десятков стирок, спущенное плечо и удлинённый силуэт дают актуальный oversize-крой.",
    priceRub: 1690,
    oldPriceRub: 1990,
    badge: "Хит",
    material: "100% хлопок, 240 г/м²",
    categorySlug: "s-printom",
    image: "/products/oversize-premium.webp",
    sortOrder: 1,
  },
  {
    slug: "classic-cotton",
    sku: "RP-TS-002",
    title: "Classic Cotton",
    excerpt: "Универсальная классика 180 г/м² — идеально под фото и логотип.",
    description:
      "Базовая футболка прямого кроя из чесаного хлопка 180 г/м². Ровная плотная ткань — лучший холст для фотопечати и брендирования.",
    priceRub: 949,
    oldPriceRub: 1190,
    badge: "Цена открытия",
    material: "100% хлопок, 180 г/м²",
    categorySlug: "s-foto",
    image: "/products/classic-cotton.webp",
    sortOrder: 2,
  },
  {
    slug: "noir-heavy",
    sku: "RP-TS-003",
    title: "Noir Heavy",
    excerpt: "Глубокий чёрный, плотный 220 г/м², печать не выгорает.",
    description:
      "Тяжёлая чёрная футболка для ярких принтов на тёмном. Печать с белой подложкой даёт сочные цвета, которые не сереют после стирки.",
    priceRub: 1490,
    material: "100% хлопок, 220 г/м²",
    categorySlug: "s-printom",
    image: "/products/noir-heavy.webp",
    sortOrder: 3,
  },
  {
    slug: "pair-edition",
    sku: "RP-TS-004",
    title: "Pair Edition",
    excerpt: "Набор парных футболок — для пар, друзей и команд.",
    description:
      "Комплект из двух футболок с согласованными принтами. Идеальный подарок на годовщину или дружеский мерч.",
    priceRub: 2790,
    badge: "Для пары",
    material: "100% хлопок, 180 г/м² (×2)",
    categorySlug: "s-nadpisyu",
    image: "/products/pair-edition.webp",
    sortOrder: 4,
  },
  {
    slug: "corporate-line",
    sku: "RP-TS-005",
    title: "Corporate Line",
    excerpt: "Корпоративный мерч с логотипом, тираж от 1 до 1000+.",
    description:
      "Решение для брендирования: фирменные цвета, логотип на груди/рукаве/спине. Согласуем макет, выдержим тираж в едином качестве и сроке.",
    priceRub: 1090,
    material: "Хлопок/пике, 160–200 г/м²",
    categorySlug: "s-logotipom",
    image: "/products/corporate-line.webp",
    sortOrder: 5,
  },
  {
    slug: "photo-art",
    sku: "RP-TS-006",
    title: "Photo Art",
    excerpt: "Фотопечать музейного качества — перенесём любое изображение.",
    description:
      "Модель под детализированную фотопечать: ровная белая ткань премиум-хлопка раскрывает полутона и цвета.",
    priceRub: 1390,
    material: "100% хлопок премиум, 190 г/м²",
    categorySlug: "s-foto",
    image: "/products/photo-art.webp",
    sortOrder: 6,
  },
];

async function main() {
  // 1) Админ из env.
  const email = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD;
  if (email && password && password.length >= 12) {
    await prisma.adminUser.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash: await hash(password, 12),
        name: process.env.ADMIN_NAME ?? "Admin",
        role: "OWNER",
      },
    });
    console.log(`Админ: ${email}`);
  } else {
    console.warn(
      "ADMIN_EMAIL/ADMIN_PASSWORD не заданы (или пароль < 12 символов) — админ не создан.",
    );
  }

  // 2) Категории.
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }
  console.log(`Категории: ${categories.length}`);

  // 3) Товары.
  for (const { categorySlug, image, ...product } of products) {
    const category = await prisma.category.findUniqueOrThrow({
      where: { slug: categorySlug },
    });
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: {
        ...product,
        published: true,
        categoryId: category.id,
        images: { create: [{ url: image, alt: product.title }] },
        colors: { create: baseColors },
      },
    });
  }
  console.log(`Товары: ${products.length}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
