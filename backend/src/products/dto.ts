import { PartialType } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";

export class ProductImageDto {
  @IsString()
  @MaxLength(500)
  url: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  alt?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class ProductColorDto {
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  name: string;

  @Matches(/^#[0-9a-fA-F]{6}$/, { message: "hex: формат #RRGGBB" })
  hex: string;
}

export class CreateProductDto {
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: "slug: только латиница, цифры и дефисы",
  })
  @MaxLength(80)
  slug: string;

  /** Артикул — уникальный код товара. */
  @IsString()
  @Matches(/^[A-Za-z0-9-]{2,40}$/, {
    message: "sku: латиница, цифры и дефисы (2–40 символов)",
  })
  sku: string;

  @IsString()
  @MinLength(2)
  @MaxLength(160)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  excerpt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsInt()
  @IsPositive()
  priceRub: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  oldPriceRub?: number;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  badge?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  material?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(12)
  sizes?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  /** Slug категории, к которой относится товар. */
  @IsString()
  categorySlug: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageDto)
  @ArrayMaxSize(10)
  images?: ProductImageDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductColorDto)
  @ArrayMaxSize(12)
  colors?: ProductColorDto[];
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}

export class ListProductsQuery {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  all?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  perPage?: number;
}
