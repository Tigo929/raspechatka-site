import "reflect-metadata";
import {
  IsString, IsNotEmpty, IsOptional, IsBoolean,
  IsIn, IsInt, Min, Max, MinLength, MaxLength, Matches,
} from "class-validator";

export class ReviewDto {
  @IsString({ message: "Имя должно быть строкой" })
  @IsNotEmpty({ message: "Укажите имя автора" })
  @MinLength(2, { message: "Имя слишком короткое" })
  @MaxLength(80, { message: "Имя слишком длинное" })
  name!: string;

  @IsString({ message: "Текст должен быть строкой" })
  @IsNotEmpty({ message: "Текст отзыва обязателен" })
  @MinLength(5, { message: "Текст слишком короткий" })
  @MaxLength(1000, { message: "Текст слишком длинный (макс. 1000 символов)" })
  text!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120, { message: "Контекст слишком длинный" })
  context?: string;

  @IsInt({ message: "Рейтинг должен быть целым числом" })
  @Min(1, { message: "Минимальный рейтинг: 1" })
  @Max(5, { message: "Максимальный рейтинг: 5" })
  rating!: number;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: "Дата должна быть в формате ГГГГ-ММ-ДД" })
  date!: string;

  @IsOptional()
  @IsIn(["manual", "yandex", "google", "2gis"], {
    message: "Источник: manual, yandex, google или 2gis",
  })
  source?: string;

  @IsOptional()
  @IsBoolean({ message: "published должно быть булевым" })
  published?: boolean;
}
