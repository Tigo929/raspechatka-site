import "reflect-metadata";
import {
  IsString, IsOptional, IsNumber, IsArray,
  Min, MaxLength, MinLength, ValidateNested, IsHexColor, IsNotEmpty,
} from "class-validator";
import { Type } from "class-transformer";

export class ProductColorDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  name!: string;

  @IsHexColor({ message: "Цвет должен быть в формате #rrggbb" })
  hex!: string;
}

export class BaseProductDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  excerpt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  material?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  printMethod?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  imageAlt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  badge?: string;

  @IsOptional()
  @IsNumber({}, { message: "Цена должна быть числом" })
  @Min(1, { message: "Цена должна быть больше 0" })
  priceFrom?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductColorDto)
  colors?: ProductColorDto[];
}
