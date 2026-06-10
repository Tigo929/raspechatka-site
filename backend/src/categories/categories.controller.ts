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
import { CategoriesService } from "./categories.service";
import { CreateCategoryDto, UpdateCategoryDto } from "./dto";

@ApiTags("categories")
@Controller("categories")
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  /** Публично: список категорий для витрины. ?all=1 (только админ) — с черновиками. */
  @Get()
  findAll(@Query("all") all?: string) {
    return this.categories.findAll(all === "1");
  }

  @Get(":slug")
  findOne(@Param("slug") slug: string) {
    return this.categories.findOne(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  create(@Body() dto: CreateCategoryDto) {
    return this.categories.create(dto);
  }

  @Patch(":slug")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  update(@Param("slug") slug: string, @Body() dto: UpdateCategoryDto) {
    return this.categories.update(slug, dto);
  }

  @Delete(":slug")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  remove(@Param("slug") slug: string) {
    return this.categories.remove(slug);
  }
}
