import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateProductDto, ListProductsQuery, UpdateProductDto } from "./dto";

const productInclude = {
  category: { select: { slug: true, title: true } },
  images: { orderBy: { sortOrder: "asc" as const } },
  colors: true,
};

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListProductsQuery) {
    const page = query.page ?? 1;
    const perPage = Math.min(query.perPage ?? 20, 100);

    const where: Prisma.ProductWhereInput = {
      ...(query.all === "1" ? {} : { published: true }),
      ...(query.category ? { category: { slug: query.category } } : {}),
      ...(query.q
        ? {
            OR: [
              { title: { contains: query.q, mode: "insensitive" } },
              { sku: { contains: query.q, mode: "insensitive" } },
              { description: { contains: query.q, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: productInclude,
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      perPage,
      pages: Math.max(1, Math.ceil(total / perPage)),
    };
  }

  async findOne(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: productInclude,
    });
    if (!product) throw new NotFoundException("Товар не найден.");
    return product;
  }

  async create(dto: CreateProductDto) {
    const categoryId = await this.resolveCategoryId(dto.categorySlug);
    const { categorySlug, images, colors, ...data } = dto;
    void categorySlug;
    try {
      return await this.prisma.product.create({
        data: {
          ...data,
          categoryId,
          images: images?.length ? { create: images } : undefined,
          colors: colors?.length ? { create: colors } : undefined,
        },
        include: productInclude,
      });
    } catch (error) {
      this.rethrowKnown(error);
    }
  }

  async update(slug: string, dto: UpdateProductDto) {
    const { categorySlug, images, colors, ...data } = dto;
    const categoryId = categorySlug
      ? await this.resolveCategoryId(categorySlug)
      : undefined;

    try {
      return await this.prisma.product.update({
        where: { slug },
        data: {
          ...data,
          ...(categoryId ? { categoryId } : {}),
          // Изображения/цвета передаются целиком — заменяем набор атомарно.
          ...(images
            ? { images: { deleteMany: {}, create: images } }
            : {}),
          ...(colors
            ? { colors: { deleteMany: {}, create: colors } }
            : {}),
        },
        include: productInclude,
      });
    } catch (error) {
      this.rethrowKnown(error);
    }
  }

  async remove(slug: string) {
    try {
      return await this.prisma.product.delete({ where: { slug } });
    } catch (error) {
      this.rethrowKnown(error);
    }
  }

  private async resolveCategoryId(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!category) {
      throw new BadRequestException(`Категория «${slug}» не существует.`);
    }
    return category.id;
  }

  private rethrowKnown(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        const target = (error.meta?.target as string[] | undefined)?.join(",");
        throw new ConflictException(
          target?.includes("sku")
            ? "Такой артикул уже существует."
            : "Такой slug уже существует.",
        );
      }
      if (error.code === "P2025") {
        throw new NotFoundException("Товар не найден.");
      }
    }
    throw error;
  }
}
