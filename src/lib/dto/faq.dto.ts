import "reflect-metadata";
import {
  IsString, IsNotEmpty, IsOptional, IsBoolean,
  IsInt, Min, MinLength, MaxLength,
} from "class-validator";

export class FaqDto {
  @IsString({ message: "Вопрос должен быть строкой" })
  @IsNotEmpty({ message: "Вопрос обязателен" })
  @MinLength(5, { message: "Вопрос слишком короткий" })
  @MaxLength(300, { message: "Вопрос слишком длинный (макс. 300 символов)" })
  question!: string;

  @IsString({ message: "Ответ должен быть строкой" })
  @IsNotEmpty({ message: "Ответ обязателен" })
  @MinLength(5, { message: "Ответ слишком короткий" })
  @MaxLength(2000, { message: "Ответ слишком длинный (макс. 2000 символов)" })
  answer!: string;

  @IsOptional()
  @IsInt({ message: "Порядок должен быть целым числом" })
  @Min(0)
  order?: number;

  @IsOptional()
  @IsBoolean({ message: "published должно быть булевым" })
  published?: boolean;
}
