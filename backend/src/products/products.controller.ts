import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CreateProductDto, ListProductsQuery, UpdateProductDto } from "./dto";
import { ProductsService } from "./products.service";

@ApiTags("products")
@Controller("products")
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  /** Публично: каталог с пагинацией, поиском (?q=) и фильтром (?category=). */
  @Get()
  findAll(@Query() query: ListProductsQuery) {
    return this.products.findAll(query);
  }

  @Get(":slug")
  findOne(@Param("slug") slug: string) {
    return this.products.findOne(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  create(@Body() dto: CreateProductDto) {
    return this.products.create(dto);
  }

  @Patch(":slug")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  update(@Param("slug") slug: string, @Body() dto: UpdateProductDto) {
    return this.products.update(slug, dto);
  }

  @Delete(":slug")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  remove(@Param("slug") slug: string) {
    return this.products.remove(slug);
  }
}
