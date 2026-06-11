import "reflect-metadata";
import { IsString, IsOptional, MaxLength, MinLength } from "class-validator";

export class CategoryDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: "Название слишком короткое" })
  @MaxLength(80, { message: "Название слишком длинное" })
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200, { message: "Описание слишком длинное" })
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200, { message: "Alt-текст слишком длинный" })
  imageAlt?: string;
}
