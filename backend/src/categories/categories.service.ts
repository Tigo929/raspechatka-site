import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCategoryDto, UpdateCategoryDto } from "./dto";

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(includeUnpublished = false) {
    return this.prisma.category.findMany({
      where: includeUnpublished ? {} : { published: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: { _count: { select: { products: true } } },
    });
  }

  async findOne(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: { _count: { select: { products: true } } },
    });
    if (!category) throw new NotFoundException("Категория не найдена.");
    return category;
  }

  async create(dto: CreateCategoryDto) {
    try {
      return await this.prisma.category.create({ data: dto });
    } catch (error) {
      this.rethrowKnown(error);
    }
  }

  async update(slug: string, dto: UpdateCategoryDto) {
    try {
      return await this.prisma.category.update({ where: { slug }, data: dto });
    } catch (error) {
      this.rethrowKnown(error);
    }
  }

  async remove(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: { _count: { select: { products: true } } },
    });
    if (!category) throw new NotFoundException("Категория не найдена.");
    if (category._count.products > 0) {
      throw new ConflictException(
        "В категории есть товары — сначала перенесите или удалите их.",
      );
    }
    return this.prisma.category.delete({ where: { slug } });
  }

  /** Преобразует известные ошибки Prisma в понятные HTTP-ответы. */
  private rethrowKnown(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        throw new ConflictException("Такой slug уже существует.");
      }
      if (error.code === "P2025") {
        throw new NotFoundException("Категория не найдена.");
      }
    }
    throw error;
  }
}
